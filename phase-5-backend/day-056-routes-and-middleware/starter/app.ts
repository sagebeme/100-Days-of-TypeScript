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
    // TODO: .get("/:id") -> the stage plus latestReport (or null)
    // TODO: .get("/:id/reports") -> { reports }, newest first
    // TODO: .post("/:id/reports"):
    //   not JSON (Content-Type) -> 415 "Send JSON, with Content-Type: application/json"
    //   bad JSON -> 400 "The body isn't valid JSON"; bad crowd -> 400 "crowd must be one of: empty, ok, packed"
    //   otherwise 201 with the report ({ id: makeId(), stageId, crowd, at }) and a Location header
    //   (throw new HTTPException(status, { message }) for every error: handleError does the rest)
    ;
  void reports;
  void now;
  void makeId;
  void CROWDS;
}

export function createApp(options: AppOptions) {
  const log = options.log ?? (() => {});
  const reports: Report[] = [];
  const started = (options.now ?? (() => new Date()))().getTime();

  const app = new Hono<AppEnv>();

  // TODO: middleware, in this order: requestId(options.makeId), logRequests(log),
  //   cors({ origin: options.allowedOrigin ?? "http://localhost:5173", allowMethods: ["GET", "POST"] }),
  //   bodyLimit({ maxSize: 10_000, onError: throw 413 "Body too large: the limit is 10000 bytes" })
  void requestId;
  void logRequests;
  void cors;
  void bodyLimit;

  app.get("/health", (c) => {
    const now = (options.now ?? (() => new Date()))().getTime();
    return c.json({ ok: true, uptimeSeconds: Math.round((now - started) / 1000) });
  });

  // TODO: app.route("/stages", stageRoutes(options, reports))
  // TODO: app.notFound -> 404 { error: "Nothing at <path>", requestId }
  // TODO: app.onError(handleError(log))
  void handleError;
  return app;
}
