import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import type { DatabaseSync } from "node:sqlite";
import type { Config } from "./config.ts";
import type { Logger } from "./logger.ts";

export interface AppDeps {
  config: Config;
  db: DatabaseSync;
  log: Logger;
  isShuttingDown: () => boolean;
}

type Env = { Variables: { log: Logger; requestId: string } };

export function createApp({ config, db, log, isShuttingDown }: AppDeps) {
  const app = new Hono<Env>();

  // Every request gets an id and its own logger, and one line when it finishes.
  app.use(
    createMiddleware<Env>(async (c, next) => {
      const requestId = crypto.randomUUID();
      const started = performance.now();
      c.set("requestId", requestId);
      c.set("log", log.child({ requestId }));
      c.header("X-Request-Id", requestId);
      await next();
      const ms = Math.round(performance.now() - started);
      const fields = { method: c.req.method, path: c.req.path, status: c.res.status, ms };
      // Health checks run every few seconds; logging each one would drown everything else.
      if (!c.req.path.startsWith("/health")) c.get("log").info("request", fields);
    }),
  );
  app.use(secureHeaders());
  app.use(cors({ origin: config.corsOrigin }));

  // Liveness: "is the process alive?" The platform restarts the app if this stops answering.
  app.get("/health/live", (c) => c.json({ status: "ok" }));

  // Readiness: "should traffic come here?" No while shutting down, or if the database is broken.
  app.get("/health/ready", (c) => {
    if (isShuttingDown()) return c.json({ status: "shutting-down" }, 503);
    try {
      db.prepare("SELECT 1").get();
      return c.json({ status: "ready" });
    } catch (error) {
      c.get("log").error("Readiness check failed", { error });
      return c.json({ status: "database-unavailable" }, 503);
    }
  });

  app.get("/", (c) => c.json({ name: "Ticketing API", environment: config.env }));

  app.onError((error, c) => {
    c.get("log").error("Unhandled error", { error, path: c.req.path });
    return c.json({ error: "Something went wrong on our side", requestId: c.get("requestId") }, 500);
  });
  return app;
}
