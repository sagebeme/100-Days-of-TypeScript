import { createServer, type Server } from "node:http";
import { randomUUID } from "node:crypto";
import { HttpError, Router, readJson, sendJson } from "./http-kit.ts";

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
  now?: () => Date;
  log?: (line: string) => void;
}

export function createApp(options: AppOptions): Server {
  const now = options.now ?? (() => new Date());
  const log = options.log ?? (() => {});
  const reports: Report[] = [];
  const started = now().getTime();

  const stage = (id: string): Stage => {
    const found = options.stages.find((s) => s.id === id);
    if (!found) throw new HttpError(404, `No stage called ${id}`);
    return found;
  };

  const router = new Router()
    .on("GET", "/health", ({ response }) => {
      sendJson(response, 200, { ok: true, uptimeSeconds: Math.round((now().getTime() - started) / 1000) });
    })
    .on("GET", "/stages", ({ response, url }) => {
      const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
      const route = url.searchParams.get("route");
      const list = options.stages.filter(
        (s) => (!q || s.name.toLowerCase().includes(q)) && (!route || s.routes.includes(route)),
      );
      sendJson(response, 200, { stages: list });
    })
    // TODO: GET /stages/:id -> the stage plus latestReport (its newest report, or null). Unknown id -> 404
    //   (the stage() helper above already throws that)
    // TODO: GET /stages/:id/reports -> { reports: [...] }, newest first
    // TODO: POST /stages/:id/reports with { "crowd": "empty" | "ok" | "packed" } -> 201 with the new report
    //   ({ id: randomUUID(), stageId, crowd, at }) and a Location header: /stages/<id>/reports/<report id>.
    //   Any other crowd -> 400 "crowd must be one of: empty, ok, packed"
    ;

  return createServer(async (request, response) => {
    // TODO: parse the URL, find the route (router.find), and run its handler.
    //   No handler, but the path exists for other methods -> 405 "<METHOD> isn't allowed here" with an Allow header
    //   No handler at all -> 404 "Nothing at <path>"
    // TODO: catch errors: an HttpError becomes { error: message } with its status (and headers);
    //   anything else is a bug: log it, and send 500 "Something went wrong on our side"
    // TODO: finally, log "<METHOD> <path> <status> <ms>ms"
    void readJson;
    void randomUUID;
    void now;
    void log;
    void reports;
    void CROWDS;
    sendJson(response, 501, { error: "not implemented yet" });
  });
}
