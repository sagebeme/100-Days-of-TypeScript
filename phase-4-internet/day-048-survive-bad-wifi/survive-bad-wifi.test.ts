import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import type { AddressInfo } from "node:net";
import { createServer, type Server } from "node:http";
import {
  fetchWithRetry,
  isRepeatable,
  parseRetryAfter,
  backoffDelay,
  NetworkError,
  type Fetcher,
} from "./starter/resilient.ts";

// Replies in order: a number is a status, an Error is thrown (like a dropped connection).
function sequence(...steps: (number | Error | Response)[]): Fetcher & ReturnType<typeof vi.fn> {
  let call = 0;
  return vi.fn(async () => {
    const step = steps[Math.min(call++, steps.length - 1)];
    if (step instanceof Error) throw step;
    if (step instanceof Response) return step;
    return new Response(JSON.stringify({ status: step }), { status: step });
  });
}

const dropped = () => new TypeError("fetch failed");

function quiet() {
  const delays: number[] = [];
  return { delays, options: { sleep: async (ms: number) => void delays.push(ms), random: () => 0.5 } };
}

describe("isRepeatable", () => {
  it("repeats requests that are safe to send twice", () => {
    expect(isRepeatable()).toBe(true);
    expect(isRepeatable({ method: "get" })).toBe(true);
    expect(isRepeatable({ method: "PUT" })).toBe(true);
    expect(isRepeatable({ method: "DELETE" })).toBe(true);
  });

  it("won't repeat a POST, which might pay twice, unless it has an idempotency key", () => {
    expect(isRepeatable({ method: "POST" })).toBe(false);
    expect(isRepeatable({ method: "POST", headers: { "Idempotency-Key": "order-42" } })).toBe(true);
  });
});

describe("parseRetryAfter", () => {
  const now = Date.parse("2026-10-21T07:28:00Z");

  it("reads seconds", () => {
    expect(parseRetryAfter("120", now)).toBe(120_000);
    expect(parseRetryAfter(" 0 ", now)).toBe(0);
  });

  it("reads an HTTP date", () => {
    expect(parseRetryAfter("Wed, 21 Oct 2026 07:28:30 GMT", now)).toBe(30_000);
    expect(parseRetryAfter("Wed, 21 Oct 2026 07:00:00 GMT", now)).toBe(0);
  });

  it("ignores what it can't read", () => {
    expect(parseRetryAfter(null, now)).toBeNull();
    expect(parseRetryAfter("", now)).toBeNull();
    expect(parseRetryAfter("soon", now)).toBeNull();
  });
});

describe("backoffDelay", () => {
  const options = { baseDelayMs: 500, maxDelayMs: 8000 };

  it("doubles the ceiling each attempt, up to the maximum", () => {
    const top = (attempt: number) => backoffDelay(attempt, { ...options, random: () => 1 });
    expect([0, 1, 2, 3, 4, 5].map(top)).toEqual([500, 1000, 2000, 4000, 8000, 8000]);
  });

  it("picks a random wait under the ceiling", () => {
    expect(backoffDelay(2, { ...options, random: () => 0.25 })).toBe(500);
    expect(backoffDelay(2, { ...options, random: () => 0 })).toBe(0);
  });
});

describe("fetchWithRetry", () => {
  it("returns straight away when it works", async () => {
    const { delays, options } = quiet();
    const fetchFn = sequence(200);
    const response = await fetchWithRetry("https://api.test/score", {}, fetchFn, options);
    expect(response.status).toBe(200);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(delays).toEqual([]);
  });

  it("retries a busy server and a dropped connection, backing off each time", async () => {
    const { delays, options } = quiet();
    const fetchFn = sequence(503, dropped(), 502, 200);
    const retries: string[] = [];
    const response = await fetchWithRetry("https://api.test/score", {}, fetchFn, {
      ...options,
      onRetry: ({ attempt, delayMs, reason }) => retries.push(`${attempt}:${delayMs}:${reason}`),
    });
    expect(response.status).toBe(200);
    expect(delays).toEqual([250, 500, 1000]);
    expect(retries).toEqual(["1:250:status 503", "2:500:fetch failed", "3:1000:status 502"]);
  });

  it("doesn't retry a request that was simply wrong", async () => {
    const { options } = quiet();
    const fetchFn = sequence(404);
    expect((await fetchWithRetry("https://api.test/nope", {}, fetchFn, options)).status).toBe(404);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("hands back the last bad response when retries run out", async () => {
    const { options } = quiet();
    const fetchFn = sequence(503);
    const response = await fetchWithRetry("https://api.test/score", {}, fetchFn, { ...options, retries: 2 });
    expect(response.status).toBe(503);
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it("gives up with a NetworkError when the network never comes back", async () => {
    const { options } = quiet();
    const attempt = fetchWithRetry("https://api.test/score", {}, sequence(dropped()), options);
    await expect(attempt).rejects.toBeInstanceOf(NetworkError);
    await expect(attempt).rejects.toThrow("Gave up after 4 attempts: fetch failed");
    const error = await attempt.catch((e: unknown) => e);
    expect(error instanceof Error && error.cause).toBeInstanceOf(TypeError);
  });

  it("waits as long as the server asks with Retry-After", async () => {
    const { delays, options } = quiet();
    const busy = new Response("{}", { status: 429, headers: { "Retry-After": "3" } });
    await fetchWithRetry("https://api.test/score", {}, sequence(busy, 200), options);
    expect(delays).toEqual([3000]);
  });

  it("won't wait forever for a greedy Retry-After", async () => {
    const { delays, options } = quiet();
    const busy = new Response("{}", { status: 503, headers: { "Retry-After": "3600" } });
    await fetchWithRetry("https://api.test/score", {}, sequence(busy, 200), { ...options, maxDelayMs: 8000 });
    expect(delays).toEqual([32_000]);
  });

  it("sends a POST once, unless it has an idempotency key", async () => {
    const { options } = quiet();
    const once = sequence(503, 200);
    expect((await fetchWithRetry("https://api.test/pay", { method: "POST" }, once, options)).status).toBe(503);
    expect(once).toHaveBeenCalledTimes(1);

    const keyed = sequence(503, 200);
    const init = { method: "POST", headers: { "Idempotency-Key": "order-42" } };
    expect((await fetchWithRetry("https://api.test/pay", init, keyed, options)).status).toBe(200);
  });

  it("stops at once when the caller cancels", async () => {
    const { options } = quiet();
    const controller = new AbortController();
    const fetchFn: Fetcher = vi.fn(async (_url, init) => {
      controller.abort();
      throw init?.signal?.reason ?? new Error("aborted");
    });
    await expect(fetchWithRetry("https://api.test/score", { signal: controller.signal }, fetchFn, options)).rejects.toThrow();
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("passes the caller's options through", async () => {
    const { options } = quiet();
    const fetchFn = sequence(200);
    await fetchWithRetry("https://api.test/score", { headers: { Accept: "application/json" } }, fetchFn, options);
    const init = fetchFn.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get("Accept")).toBe("application/json");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});

describe("against a real, badly behaved server", () => {
  let server: Server;
  let base: string;
  let hits = 0;

  beforeAll(async () => {
    server = createServer((request, response) => {
      hits++;
      if (request.url === "/hang") return; // never answers
      if (request.url === "/drop-once" && hits % 2 === 1) return request.socket.destroy();
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end('{"ok":true}');
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("times out a request that never answers", async () => {
    const { options } = quiet();
    const attempt = fetchWithRetry(`${base}/hang`, {}, fetch, { ...options, timeoutMs: 50, retries: 1 });
    await expect(attempt).rejects.toThrow("Gave up after 2 attempts: timed out");
  });

  it("gets through a dropped connection", async () => {
    hits = 0;
    const { options } = quiet();
    const response = await fetchWithRetry(`${base}/drop-once`, {}, fetch, options);
    expect(await response.json()).toEqual({ ok: true });
  });
});
