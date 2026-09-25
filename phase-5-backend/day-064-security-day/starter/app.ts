import { Hono, type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { DatabaseSync } from "node:sqlite";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { hashForDemo } from "./db.ts";
import { reviewsPage, type Review } from "./html.ts";
import { createRateLimiter } from "./rate-limit.ts";

// ------------------------------------------------------------------
// THIS APP WORKS, AND IT IS FULL OF HOLES. Each one is marked "HOLE".
// Run the tests: every attack in them succeeds right now. Close the holes until they all fail.
// ------------------------------------------------------------------

export interface AppOptions {
  db: DatabaseSync;
  sessionSecret: string; // a secret: it must never appear in a response or a log
  trustProxy?: boolean; // only true when a proxy you control sets X-Forwarded-For
  now?: () => number;
  log?: (line: string) => void;
}

// Who's asking? Use this for rate limiting (HOLE 4). Behind a proxy the real address is in
// X-Forwarded-For, but anyone can send that header, so it's only trusted when trustProxy is on.
export function clientIp(c: Context, trustProxy: boolean): string {
  if (trustProxy) {
    const forwarded = c.req.header("X-Forwarded-For")?.split(",")[0]?.trim();
    if (forwarded) return forwarded;
  }
  return c.req.header("X-Real-Ip") ?? "direct";
}

// A login token: the user's id, signed with the server's secret. Without the secret, nobody can sign
// a different id. So if the secret leaks, anyone can log in as anyone.
export function signToken(userId: number, secret: string): string {
  return `${userId}.${createHmac("sha256", secret).update(String(userId)).digest("base64url")}`;
}

export function verifyToken(token: string, secret: string): number | null {
  const [id, signature] = token.split(".");
  if (!id || !signature || !/^\d+$/.test(id)) return null;
  const expected = Buffer.from(signToken(Number(id), secret).split(".")[1]);
  const given = Buffer.from(signature);
  return given.length === expected.length && timingSafeEqual(given, expected) ? Number(id) : null;
}

export function createApp(options: AppOptions) {
  const { db } = options;
  const log = options.log ?? (() => {});
  void createRateLimiter; // you'll need this for HOLE 4
  void log;

  const app = new Hono();

  // HOLE 6: no security headers at all. (Hono's secureHeaders middleware, plus a Content-Security-Policy.)

  // HOLE 1: the search words are glued straight into the SQL.
  app.get("/reviews/search", (c) => {
    const q = c.req.query("q") ?? "";
    const rows = db
      .prepare(`SELECT id, vendor, author, body, stars FROM reviews WHERE vendor LIKE '%${q}%' OR body LIKE '%${q}%' ORDER BY id`)
      .all() as unknown as Review[];
    return c.json({ reviews: rows });
  });

  app.post("/reviews", async (c) => {
    const input = z
      .object({
        vendor: z.string().trim().min(2).max(60),
        author: z.string().trim().min(2).max(40),
        body: z.string().trim().min(3).max(500),
        stars: z.number().int().min(1).max(5),
      })
      .safeParse(await c.req.json().catch(() => null));
    if (!input.success) throw new HTTPException(422, { message: "Check the review and try again" });
    const { vendor, author, body, stars } = input.data;
    const result = db.prepare("INSERT INTO reviews (vendor, author, body, stars) VALUES (?, ?, ?, ?)").run(vendor, author, body, stars);
    return c.json({ id: Number(result.lastInsertRowid) }, 201);
  });

  // HOLE 2: the reviews go into the HTML as they were typed (see html.ts).
  app.get("/reviews/page", (c) => {
    const rows = db.prepare("SELECT id, vendor, author, body, stars FROM reviews ORDER BY id").all() as unknown as Review[];
    return c.html(reviewsPage(rows));
  });

  // HOLE 4: nothing stops someone trying a million passwords.
  app.post("/login", async (c) => {
    const { email, password } = ((await c.req.json().catch(() => ({}))) ?? {}) as { email?: unknown; password?: unknown };
    const account = typeof email === "string" ? email.trim().toLowerCase() : "";
    const user = db.prepare("SELECT id, name, role, password_hash FROM users WHERE email = ?").get(account) as
      | { id: number; name: string; role: string; password_hash: string }
      | undefined;
    const given = Buffer.from(hashForDemo(typeof password === "string" ? password : ""));
    const expected = Buffer.from(user?.password_hash ?? hashForDemo("no-such-user"));
    if (!user || !timingSafeEqual(given, expected)) throw new HTTPException(401, { message: "Email or password is wrong" });
    return c.json({ user: { id: user.id, name: user.name }, token: signToken(user.id, options.sessionSecret) });
  });

  // HOLE 5: every field in the body is written to the user, including ones they must never change.
  app.patch("/me", async (c) => {
    const token = c.req.header("Authorization")?.replace(/^Bearer /, "") ?? "";
    const userId = verifyToken(token, options.sessionSecret);
    if (userId === null) throw new HTTPException(401, { message: "Log in first" });
    const body = ((await c.req.json().catch(() => null)) ?? {}) as Record<string, string | undefined>;
    db.prepare("UPDATE users SET name = coalesce(?, name), role = coalesce(?, role) WHERE id = ?").run(body.name ?? null, body.role ?? null, userId);
    return c.json({ user: db.prepare("SELECT id, name, role FROM users WHERE id = ?").get(userId) });
  });

  // HOLE 3: a debugging route someone forgot to remove...
  app.get("/debug", (c) => c.json({ ok: true, config: { ...options, db: "(database)" } }));

  // ...and errors that show the details of what went wrong, to anyone.
  app.onError((error, c) => {
    if (error instanceof HTTPException) return c.json({ error: error.message }, error.status);
    return c.json({ error: error.message, stack: error.stack, secret: options.sessionSecret.slice(0, 4) + "…" }, 500);
  });
  return app;
}
