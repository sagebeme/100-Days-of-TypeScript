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
    .on("GET", "/stages/:id", ({ response, params }) => {
      const found = stage(params.id);
      const latest = reports.filter((r) => r.stageId === found.id).at(-1) ?? null;
      sendJson(response, 200, { ...found, latestReport: latest });
    })
    .on("GET", "/stages/:id/reports", ({ response, params }) => {
      stage(params.id);
      sendJson(response, 200, { reports: reports.filter((r) => r.stageId === params.id).reverse() });
    })
    .on("POST", "/stages/:id/reports", async ({ request, response, params }) => {
      stage(params.id);
      const body = await readJson(request);
      const crowd = (body as { crowd?: unknown } | null)?.crowd;
      if (typeof crowd !== "string" || !CROWDS.includes(crowd as Crowd)) {
        throw new HttpError(400, `crowd must be one of: ${CROWDS.join(", ")}`);
      }
      const report: Report = { id: randomUUID(), stageId: params.id, crowd: crowd as Crowd, at: now().toISOString() };
      reports.push(report);
      sendJson(response, 201, report, { Location: `/stages/${params.id}/reports/${report.id}` });
    });

  return createServer(async (request, response) => {
    const startedAt = performance.now();
    const url = new URL(request.url ?? "/", "http://localhost");
    const method = request.method ?? "GET";
    try {
      const { handler, params, allowed } = router.find(method, url.pathname);
      if (handler) {
        await handler({ request, response, url, params });
      } else if (allowed.length > 0) {
        throw new HttpError(405, `${method} isn't allowed here`, { Allow: allowed.join(", ") });
      } else {
        throw new HttpError(404, `Nothing at ${url.pathname}`);
      }
    } catch (error) {
      if (error instanceof HttpError) {
        sendJson(response, error.status, { error: error.message }, error.headers);
      } else {
        // A bug: log the details for yourself, tell the client nothing about your code.
        log(`Unexpected error: ${error instanceof Error ? error.stack : error}`);
        sendJson(response, 500, { error: "Something went wrong on our side" });
      }
    } finally {
      log(`${method} ${url.pathname} ${response.statusCode} ${(performance.now() - startedAt).toFixed(1)}ms`);
    }
  });
}
