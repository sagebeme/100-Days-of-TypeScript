import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import { HTTPException } from "hono/http-exception";
import { requestId, logRequests, handleError, type AppEnv } from "./middleware.ts";

export interface Stage {
  id: string;
  name: string;
  routes: string[];
}

export type Crowd = "empty" | "ok" | "packed";
const CROWDS: readonly Crowd[] = ["empty", "ok", "packed"];

export interface Report {
  id: string;
  stageId: string;
  crowd: Crowd;
  at: string;
}

export interface AppOptions {
  stages: Stage[];
  allowedOrigin?: string; // the website allowed to call this API from a browser
  now?: () => Date;
  makeId?: () => string;
  log?: (line: string) => void;
}

// The stage routes on their own, mounted under /stages below. Big apps are many small routers.
function stageRoutes(options: AppOptions, reports: Report[]) {
  const now = options.now ?? (() => new Date());
  const makeId = options.makeId ?? (() => crypto.randomUUID());

  const find = (id: string): Stage => {
    const stage = options.stages.find((s) => s.id === id);
    if (!stage) throw new HTTPException(404, { message: `No stage called ${id}` });
    return stage;
  };

  return new Hono<AppEnv>()
    .get("/", (c) => {
      const q = c.req.query("q")?.trim().toLowerCase() ?? "";
      const route = c.req.query("route");
      const stages = options.stages.filter(
        (s) => (!q || s.name.toLowerCase().includes(q)) && (!route || s.routes.includes(route)),
      );
      return c.json({ stages });
    })
    .get("/:id", (c) => {
      const stage = find(c.req.param("id"));
      const latestReport = reports.filter((r) => r.stageId === stage.id).at(-1) ?? null;
      return c.json({ ...stage, latestReport });
    })
    .get("/:id/reports", (c) => {
      const stage = find(c.req.param("id"));
      return c.json({ reports: reports.filter((r) => r.stageId === stage.id).reverse() });
    })
    .post("/:id/reports", async (c) => {
      const stage = find(c.req.param("id"));
      if (!c.req.header("Content-Type")?.startsWith("application/json")) {
        throw new HTTPException(415, { message: "Send JSON, with Content-Type: application/json" });
      }
      const body: unknown = await c.req.json().catch(() => {
        throw new HTTPException(400, { message: "The body isn't valid JSON" });
      });
      const crowd = (body as { crowd?: unknown } | null)?.crowd;
      if (typeof crowd !== "string" || !CROWDS.includes(crowd as Crowd)) {
        throw new HTTPException(400, { message: `crowd must be one of: ${CROWDS.join(", ")}` });
      }
      const report: Report = { id: makeId(), stageId: stage.id, crowd: crowd as Crowd, at: now().toISOString() };
      reports.push(report);
      c.header("Location", `/stages/${stage.id}/reports/${report.id}`);
      return c.json(report, 201);
    });
}

export function createApp(options: AppOptions) {
  const log = options.log ?? (() => {});
  const reports: Report[] = [];
  const started = (options.now ?? (() => new Date()))().getTime();

  const app = new Hono<AppEnv>();

  // Middleware runs in the order it's added, for every request that matches.
  app.use(requestId(options.makeId));
  app.use(logRequests(log));
  app.use(cors({ origin: options.allowedOrigin ?? "http://localhost:5173", allowMethods: ["GET", "POST"] }));
  app.use(
    bodyLimit({
      maxSize: 10_000,
      onError: () => {
        throw new HTTPException(413, { message: "Body too large: the limit is 10000 bytes" });
      },
    }),
  );

  app.get("/health", (c) => {
    const now = (options.now ?? (() => new Date()))().getTime();
    return c.json({ ok: true, uptimeSeconds: Math.round((now - started) / 1000) });
  });
  app.route("/stages", stageRoutes(options, reports));

  app.notFound((c) => c.json({ error: `Nothing at ${c.req.path}`, requestId: c.get("requestId") }, 404));
  app.onError(handleError(log));
  return app;
}
