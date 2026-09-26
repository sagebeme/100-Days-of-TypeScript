import { Hono, type Context } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { createLink, deleteLink, findLink, linkStats, ownsLink, recordClick, referrerSite, slugProblem, urlProblem, SlugTaken, type LinkDb } from "./links.ts";
import { HOME_PAGE, NOT_FOUND_PAGE } from "./page.ts";

export interface AppOptions {
  db: LinkDb;
  baseUrl: string; // "https://tkt.example": where short links live
  now?: () => Date;
  createPerMinute?: number;
}

// A small fixed-window rate limit: this many new links per client per minute.
function rateLimiter(perMinute: number, now: () => Date) {
  const windows = new Map<string, { start: number; count: number }>();
  return (client: string): boolean => {
    const t = now().getTime();
    const w = windows.get(client);
    if (!w || t - w.start >= 60_000) {
      windows.set(client, { start: t, count: 1 });
      return true;
    }
    w.count++;
    return w.count <= perMinute;
  };
}

export function createApp(options: AppOptions) {
  const { db, baseUrl } = options;
  const now = options.now ?? (() => new Date());
  const ownHost = new URL(baseUrl).hostname;
  const allow = rateLimiter(options.createPerMinute ?? 10, now);
  const app = new Hono();
  app.use(secureHeaders());

  const bearer = (c: Context) => /^Bearer (.+)$/.exec(c.req.header("Authorization") ?? "")?.[1] ?? "";
  const client = (c: Context) => c.req.header("x-forwarded-for")?.split(",")[0].trim() || "local";

  app.get("/", (c) => c.html(HOME_PAGE));
  app.get("/health", (c) => c.json({ status: "ok" }));

  app.post("/api/links", async (c) => {
    if (!allow(client(c))) return c.json({ error: "Too many new links. Try again in a minute." }, 429);
    const body = (await c.req.json().catch(() => null)) as { url?: unknown; slug?: unknown } | null;
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    const problem = urlProblem(url, ownHost);
    if (problem) return c.json({ error: problem }, 422);
    const slug = typeof body?.slug === "string" && body.slug.trim() ? body.slug.trim().toLowerCase() : null;
    if (slug) {
      const bad = slugProblem(slug);
      if (bad) return c.json({ error: bad }, 422);
    }
    try {
      const created = createLink(db, url, slug, now());
      return c.json({ slug: created.slug, shortUrl: `${baseUrl}/${created.slug}`, token: created.token, url }, 201);
    } catch (error) {
      if (error instanceof SlugTaken) return c.json({ error: error.message }, 409);
      throw error;
    }
  });

  // Someone else's link, or one that doesn't exist: the same 404, so tokens can't be tested against slugs.
  app.get("/api/links/:slug/stats", (c) => {
    const slug = c.req.param("slug");
    if (!ownsLink(db, slug, bearer(c))) return c.json({ error: "No such link" }, 404);
    return c.json(linkStats(db, slug, now()));
  });

  app.delete("/api/links/:slug", (c) => {
    const slug = c.req.param("slug");
    if (!ownsLink(db, slug, bearer(c))) return c.json({ error: "No such link" }, 404);
    deleteLink(db, slug);
    return c.body(null, 204);
  });

  // The redirect. 302, not 301: browsers remember a 301 forever, and the clicks would stop being counted.
  app.get("/:slug", (c) => {
    const slug = c.req.param("slug").toLowerCase();
    const link = findLink(db, slug);
    if (!link) return c.html(NOT_FOUND_PAGE, 404);
    recordClick(db, slug, referrerSite(c.req.header("Referer")), now());
    c.header("Cache-Control", "private, max-age=0");
    return c.redirect(link.url, 302);
  });

  app.onError((error, c) => {
    console.error(error);
    return c.json({ error: "Something went wrong" }, 500);
  });
  return app;
}
