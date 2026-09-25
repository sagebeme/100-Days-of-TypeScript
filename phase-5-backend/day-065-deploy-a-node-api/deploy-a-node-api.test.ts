import { describe, it, expect, afterEach } from "vitest";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { DatabaseSync } from "node:sqlite";
import { loadConfig } from "./starter/config.ts";
import { createLogger, redact } from "./starter/logger.ts";
import { gracefulShutdown } from "./starter/shutdown.ts";
import { createApp } from "./starter/app.ts";

const GOOD_SECRET = "k3v9-long-random-production-secret-0123456789";
const production = { NODE_ENV: "production", SESSION_SECRET: GOOD_SECRET, DATABASE_PATH: "/data/app.db", CORS_ORIGIN: "https://tickets.example" };

describe("config per environment", () => {
  it("gives development friendly defaults", () => {
    expect(loadConfig({})).toEqual({
      env: "development",
      port: 3000,
      databasePath: "./dev.db",
      logLevel: "debug",
      sessionSecret: "dev-only-secret-not-for-production!!",
      trustProxy: false,
      corsOrigin: "http://localhost:5173",
    });
  });

  it("gives tests a throwaway database and quiet logs", () => {
    expect(loadConfig({ NODE_ENV: "test" })).toMatchObject({ databasePath: ":memory:", logLevel: "warn" });
  });

  it("starts in production only with every setting it needs", () => {
    expect(loadConfig(production)).toMatchObject({ env: "production", logLevel: "info", trustProxy: true, databasePath: "/data/app.db" });
  });

  it("refuses to start production with a missing, weak or development secret, listing every problem", () => {
    const attempt = (env: Record<string, string>) => {
      try {
        loadConfig(env);
        return "";
      } catch (error) {
        return (error as Error).message;
      }
    };
    const everything = attempt({ NODE_ENV: "production" });
    expect(everything).toContain("SESSION_SECRET: set a random secret of at least 32 characters");
    expect(everything).toContain("DATABASE_PATH:");
    expect(everything).toContain("CORS_ORIGIN: set your website's https:// address");
    expect(attempt({ ...production, SESSION_SECRET: "short" })).toContain("SESSION_SECRET");
    expect(attempt({ ...production, SESSION_SECRET: "dev-only-secret-not-for-production!!" })).toContain("that's the development secret");
    expect(attempt({ ...production, CORS_ORIGIN: "http://tickets.example" })).toContain("CORS_ORIGIN");
  });

  it("rejects nonsense values", () => {
    expect(() => loadConfig({ PORT: "eighty" })).toThrow(/PORT/);
    expect(() => loadConfig({ NODE_ENV: "staging" })).toThrow(/NODE_ENV/);
  });
});

describe("structured logging", () => {
  const capture = (level: "debug" | "info" | "warn" | "error") => {
    const lines: Record<string, unknown>[] = [];
    const log = createLogger({ level, write: (line) => lines.push(JSON.parse(line)), now: () => new Date("2026-10-05T09:00:00Z") });
    return { lines, log };
  };

  it("writes one JSON object per line", () => {
    const { lines, log } = capture("debug");
    log.info("Ticket sold", { eventId: 7, quantity: 2 });
    expect(lines).toEqual([{ time: "2026-10-05T09:00:00.000Z", level: "info", msg: "Ticket sold", eventId: 7, quantity: 2 }]);
  });

  it("skips lines below its level", () => {
    const { lines, log } = capture("warn");
    log.debug("noise");
    log.info("more noise");
    log.warn("careful");
    log.error("broken");
    expect(lines.map((l) => l.level)).toEqual(["warn", "error"]);
  });

  it("never writes secrets, however deep they are", () => {
    expect(
      redact({ user: "amina", password: "hunter2", headers: { Authorization: "Bearer abc", accept: "json" }, config: { sessionSecret: "s", passengers: 14 } }),
    ).toEqual({ user: "amina", password: "[redacted]", headers: { Authorization: "[redacted]", accept: "json" }, config: { sessionSecret: "[redacted]", passengers: 14 } });
  });

  it("adds fields to every line with a child logger", () => {
    const { lines, log } = capture("info");
    const request = log.child({ requestId: "r-1" });
    request.info("start");
    request.child({ userId: 9 }).info("bought");
    expect(lines.map(({ requestId, userId }) => ({ requestId, userId }))).toEqual([
      { requestId: "r-1", userId: undefined },
      { requestId: "r-1", userId: 9 },
    ]);
  });

  it("logs an error's name, message and stack", () => {
    const { lines, log } = capture("info");
    log.error("Payment failed", { error: new TypeError("amount is undefined") });
    expect(lines[0].error).toMatchObject({ name: "TypeError", message: "amount is undefined", stack: expect.stringContaining("TypeError") });
  });
});

describe("health checks", () => {
  const setup = (shuttingDown = false) => {
    const db = new DatabaseSync(":memory:");
    const lines: string[] = [];
    const app = createApp({ config: loadConfig({ NODE_ENV: "test" }), db, log: createLogger({ level: "debug", write: (l) => lines.push(l) }), isShuttingDown: () => shuttingDown });
    return { db, app, lines };
  };

  it("is alive, and ready when the database answers", async () => {
    const { app } = setup();
    expect(await (await app.request("/health/live")).json()).toEqual({ status: "ok" });
    expect(await (await app.request("/health/ready")).json()).toEqual({ status: "ready" });
  });

  it("isn't ready while shutting down, so traffic moves elsewhere", async () => {
    const { app } = setup(true);
    const response = await app.request("/health/ready");
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "shutting-down" });
  });

  it("isn't ready when the database is gone", async () => {
    const { app, db } = setup();
    db.close();
    expect((await app.request("/health/ready")).status).toBe(503);
  });

  it("logs real requests, but not every health check", async () => {
    const { app, lines } = setup();
    await app.request("/health/live");
    await app.request("/");
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0])).toMatchObject({ msg: "request", method: "GET", path: "/", status: 200 });
  });
});

describe("graceful shutdown", () => {
  let server: Server;
  afterEach(() => server?.closeAllConnections());

  async function start(handlerMs: number) {
    server = createServer((_req, res) => setTimeout(() => res.end("done"), handlerMs));
    await new Promise<void>((resolve) => server.listen(0, resolve));
    return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  }
  const quiet = () => createLogger({ level: "error", write: () => {} });

  it("lets a request in progress finish, then closes the database", async () => {
    const url = await start(150);
    const events: string[] = [];
    const stopper = gracefulShutdown({ server, timeoutMs: 2000, onClosed: () => void events.push("database closed"), log: quiet() });

    const inFlight = fetch(url).then(async (r) => events.push(`request finished: ${await r.text()}`));
    await new Promise((resolve) => setTimeout(resolve, 30)); // the request is now being handled
    expect(stopper.isShuttingDown()).toBe(false);
    const done = stopper.shutdown("SIGTERM");
    expect(stopper.isShuttingDown()).toBe(true);

    expect(await done).toBe(0);
    await inFlight;
    expect(events).toEqual(["request finished: done", "database closed"]);
  });

  it("refuses new connections once it's shutting down", async () => {
    const url = await start(150);
    const slow = fetch(url).catch(() => null);
    await new Promise((resolve) => setTimeout(resolve, 30));
    const stopper = gracefulShutdown({ server, timeoutMs: 2000, onClosed: () => {}, log: quiet() });
    void stopper.shutdown("SIGTERM");
    await expect(fetch(url, { headers: { Connection: "close" } })).rejects.toThrow();
    await slow;
  });

  it("gives up waiting after the timeout, and says it didn't stop cleanly", async () => {
    await start(5_000).then((url) => void fetch(url).catch(() => null));
    await new Promise((resolve) => setTimeout(resolve, 30));
    const started = Date.now();
    const stopper = gracefulShutdown({ server, timeoutMs: 100, onClosed: () => {}, log: quiet() });
    expect(await stopper.shutdown("SIGTERM")).toBe(1);
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it("only shuts down once, however many signals arrive", async () => {
    await start(10);
    let closes = 0;
    const stopper = gracefulShutdown({ server, timeoutMs: 1000, onClosed: () => void closes++, log: quiet() });
    const [a, b] = await Promise.all([stopper.shutdown("SIGTERM"), stopper.shutdown("SIGINT")]);
    expect([a, b, closes]).toEqual([0, 0, 1]);
  });
});
