import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { requestId, logRequests, handleError, type AppEnv } from "./starter/middleware.ts";
import { createApp, type Stage } from "./starter/app.ts";

const stages: Stage[] = [
  { id: "kencom", name: "Kencom", routes: ["33", "34", "46"] },
  { id: "railways", name: "Railways", routes: ["33", "58"] },
];

describe("middleware on its own", () => {
  it("gives each request an id, or keeps a sensible one from a proxy", async () => {
    const app = new Hono<AppEnv>().use(requestId(() => "made-1")).get("/", (c) => c.text(c.get("requestId")));
    const fresh = await app.request("/");
    expect(await fresh.text()).toBe("made-1");
    expect(fresh.headers.get("X-Request-Id")).toBe("made-1");
    expect(await (await app.request("/", { headers: { "X-Request-Id": "edge-42" } })).text()).toBe("edge-42");
    expect(await (await app.request("/", { headers: { "X-Request-Id": "<script>" } })).text()).toBe("made-1");
  });

  it("logs on the way out, after the handler has run", async () => {
    const lines: string[] = [];
    const app = new Hono<AppEnv>()
      .use(requestId(() => "r1"))
      .use(logRequests((line) => lines.push(line)))
      .get("/slow", async (c) => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return c.text("done", 202);
      });
    await app.request("/slow");
    expect(lines).toHaveLength(1);
    const [id, method, path, status, ms] = lines[0].split(" ");
    expect([id, method, path, status]).toEqual(["r1", "GET", "/slow", "202"]);
    expect(Number.parseFloat(ms)).toBeGreaterThanOrEqual(19);
  });

  it("turns errors into one JSON shape, and hides bugs", async () => {
    const lines: string[] = [];
    const app = new Hono<AppEnv>()
      .use(requestId(() => "r2"))
      .get("/teapot", () => {
        throw new HTTPException(418, { message: "I'm a teapot" });
      })
      .get("/bug", () => {
        throw new Error("database password is hunter2");
      });
    app.onError(handleError((line) => lines.push(line)));

    const teapot = await app.request("/teapot");
    expect(teapot.status).toBe(418);
    expect(await teapot.json()).toEqual({ error: "I'm a teapot", requestId: "r2" });

    const bug = await app.request("/bug");
    expect(bug.status).toBe(500);
    const body = await bug.json();
    expect(body).toEqual({ error: "Something went wrong on our side", requestId: "r2" });
    expect(JSON.stringify(body)).not.toContain("hunter2");
    expect(lines[0]).toMatch(/^r2 Unexpected error: Error: database password is hunter2/);
  });
});

describe("the stage API on Hono", () => {
  let app: ReturnType<typeof createApp>;
  let lines: string[];
  let n: number;

  beforeEach(() => {
    lines = [];
    n = 0;
    app = createApp({
      stages,
      now: () => new Date("2026-10-05T07:30:00Z"),
      makeId: () => `id-${++n}`,
      log: (line) => lines.push(line),
    });
  });

  const post = (path: string, body: string, contentType = "application/json") =>
    app.request(path, { method: "POST", headers: { "Content-Type": contentType }, body });

  it("serves the same routes as Day 55", async () => {
    expect(await (await app.request("/health")).json()).toEqual({ ok: true, uptimeSeconds: 0 });
    expect((await (await app.request("/stages?route=58")).json()).stages.map((s: Stage) => s.id)).toEqual(["railways"]);
    expect(await (await app.request("/stages/kencom")).json()).toEqual({ ...stages[0], latestReport: null });
  });

  it("creates a report", async () => {
    const response = await post("/stages/kencom/reports", '{"crowd":"packed"}');
    expect(response.status).toBe(201);
    const report = await response.json();
    expect(report).toEqual({ id: expect.stringMatching(/^id-/), stageId: "kencom", crowd: "packed", at: "2026-10-05T07:30:00.000Z" });
    expect(response.headers.get("Location")).toBe(`/stages/kencom/reports/${report.id}`);
    expect((await (await app.request("/stages/kencom/reports")).json()).reports).toEqual([report]);
    expect((await (await app.request("/stages/kencom")).json()).latestReport).toEqual(report);
  });

  it("puts a request id on every response, errors included", async () => {
    const ok = await app.request("/stages");
    expect(ok.headers.get("X-Request-Id")).toMatch(/^id-/);
    const missing = await app.request("/stages/nowhere");
    expect(missing.status).toBe(404);
    const body = await missing.json();
    expect(body).toEqual({ error: "No stage called nowhere", requestId: missing.headers.get("X-Request-Id") });
  });

  it("answers unknown paths with JSON", async () => {
    const response = await app.request("/buses");
    expect(response.status).toBe(404);
    expect((await response.json()).error).toBe("Nothing at /buses");
  });

  it.each([
    ["crowd=packed", "application/x-www-form-urlencoded", 415, "Send JSON, with Content-Type: application/json"],
    ["{crowd", "application/json", 400, "The body isn't valid JSON"],
    ['{"crowd":"full"}', "application/json", 400, "crowd must be one of: empty, ok, packed"],
  ])("rejects %j", async (body, type, status, message) => {
    const response = await post("/stages/kencom/reports", body, type);
    expect(response.status).toBe(status);
    expect((await response.json()).error).toBe(message);
  });

  it("limits the body size", async () => {
    const response = await post("/stages/kencom/reports", JSON.stringify({ crowd: "ok", note: "x".repeat(20_000) }));
    expect(response.status).toBe(413);
    expect((await response.json()).error).toBe("Body too large: the limit is 10000 bytes");
  });

  it("lets the website's origin call it from a browser, and nobody else", async () => {
    const allowed = await app.request("/stages", { headers: { Origin: "http://localhost:5173" } });
    expect(allowed.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
    const stranger = await app.request("/stages", { headers: { Origin: "https://evil.example" } });
    expect(stranger.headers.get("Access-Control-Allow-Origin")).not.toBe("https://evil.example");
  });

  it("logs every request", async () => {
    await app.request("/stages");
    await app.request("/stages/nowhere");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^id-\d+ GET \/stages 200 /);
    expect(lines[1]).toMatch(/^id-\d+ GET \/stages\/nowhere 404 /);
  });
});
