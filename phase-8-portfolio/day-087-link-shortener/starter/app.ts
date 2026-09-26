import { Hono } from "hono";
import type { LinkDb } from "./links.ts";
import { HOME_PAGE } from "./page.ts";

export interface AppOptions {
  db: LinkDb;
  baseUrl: string; // "https://tkt.example": where short links live
  now?: () => Date;
  createPerMinute?: number;
}

// TODO: GET /, POST /api/links, GET /api/links/:slug/stats, DELETE /api/links/:slug, GET /:slug.
export function createApp(options: AppOptions) {
  void options;
  const app = new Hono();
  app.get("/", (c) => c.html(HOME_PAGE));
  return app;
}
