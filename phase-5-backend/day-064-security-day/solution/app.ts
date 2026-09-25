import { Hono, type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import type { DatabaseSync } from "node:sqlite";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { hashForDemo } from "./db.ts";
import { reviewsPage, type Review } from "./html.ts";
import { createRateLimiter } from "./rate-limit.ts";

export interface AppOptions {
  db: DatabaseSync;
  sessionSecret: string; // a secret: it must never appear in a response or a log
  trustProxy?: boolean; // only true when a proxy you control sets X-Forwarded-For
  now?: () => number;
  log?: (line: string) => void;
}

// FIX 4 (brute force): who's asking? Behind a proxy the real address is in X-Forwarded-For, but anyone
// can send that header, so it's only trusted when you know a proxy of yours set it.
export function clientIp(c: Context, trustProxy: boolean): string {
  if (trustProxy) {
    const forwarded = c.req.header("X-Forwarded-For")?.split(",")[0]?.trim();
    if (forwarded) return forwarded;
  }
  return c.req.header("X-Real-Ip") ?? "direct";
}

// A login token: the user's id, signed with the server's secret. Anyone can read the id, but without the
// secret nobody can make a valid signature for a different id. That's why the secret must never leak.
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
  const byIp = createRateLimiter({ limit: 20, windowMs: 60_000, now: options.now });
  const byAccount = createRateLimiter({ limit: 5, windowMs: 15 * 60_000, now: options.now });

  const app = new Hono();

  // FIX 6 (headers): the safe defaults every page should have, plus a Content Security Policy
  // that refuses any script the page didn't ship itself, so injected <script> tags don't run.
  app.use(
    secureHeaders({
      contentSecurityPolicy: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], objectSrc: ["'none'"], frameAncestors: ["'none'"] },
      strictTransportSecurity: "max-age=63072000; includeSubDomains",
      referrerPolicy: "no-referrer",
    }),
  );

  // FIX 1 (SQL injection): the search words are a PARAMETER (?), never glued into the SQL text.
  // The database treats them as data, so ' OR 1=1 -- is just a strange thing to search for.
  app.get("/reviews/search", (c) => {
    const q = c.req.query("q") ?? "";
    const rows = db
      .prepare("SELECT id, vendor, author, body, stars FROM reviews WHERE vendor LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\' ORDER BY id")
      .all(...Array(2).fill(`%${q.replace(/[\\%_]/g, "\\$&")}%`)) as unknown as Review[];
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

  // FIX 2 (stored XSS): every review is escaped on the way into the HTML (see html.ts).
  app.get("/reviews/page", (c) => {
    const rows = db.prepare("SELECT id, vendor, author, body, stars FROM reviews ORDER BY id").all() as unknown as Review[];
    return c.html(reviewsPage(rows));
  });

  // FIX 4 (brute force): limited per IP address AND per account, with the same answer either way.
  app.post("/login", async (c) => {
    const { email, password } = ((await c.req.json().catch(() => ({}))) ?? {}) as { email?: unknown; password?: unknown };
    const account = typeof email === "string" ? email.trim().toLowerCase() : "";
    for (const verdict of [byIp.hit(clientIp(c, options.trustProxy ?? false)), byAccount.hit(account)]) {
      if (!verdict.allowed) {
        c.header("Retry-After", String(verdict.retryAfterSeconds));
        throw new HTTPException(429, { message: "Too many attempts. Wait a bit and try again." });
      }
    }
    const user = db.prepare("SELECT id, name, role, password_hash FROM users WHERE email = ?").get(account) as
      | { id: number; name: string; role: string; password_hash: string }
      | undefined;
    const given = Buffer.from(hashForDemo(typeof password === "string" ? password : ""));
    const expected = Buffer.from(user?.password_hash ?? hashForDemo("no-such-user"));
    if (!user || !timingSafeEqual(given, expected)) throw new HTTPException(401, { message: "Email or password is wrong" });
    byAccount.reset(account); // a successful login clears the account's count
    return c.json({ user: { id: user.id, name: user.name }, token: signToken(user.id, options.sessionSecret) });
  });

  // FIX 5 (mass assignment): only the fields a user may change are copied from the request.
  // Spreading the whole body into the update would let anyone send { "role": "admin" }.
  app.patch("/me", async (c) => {
    const token = c.req.header("Authorization")?.replace(/^Bearer /, "") ?? "";
    const userId = verifyToken(token, options.sessionSecret);
    if (userId === null) throw new HTTPException(401, { message: "Log in first" });
    const body = ((await c.req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
    const allowed = z.object({ name: z.string().trim().min(2).max(40) }).safeParse({ name: body.name });
    if (!allowed.success) throw new HTTPException(422, { message: "Send a name of 2 to 40 characters" });
    db.prepare("UPDATE users SET name = ? WHERE id = ?").run(allowed.data.name, userId);
    return c.json({ user: db.prepare("SELECT id, name, role FROM users WHERE id = ?").get(userId) });
  });

  // FIX 3 (leaking secrets): there is no /debug route any more, and errors say nothing about the code.
  app.onError((error, c) => {
    if (error instanceof HTTPException) return c.json({ error: error.message }, error.status);
    log(`Unexpected error: ${error.message}`); // logged for you; never sent to the client
    return c.json({ error: "Something went wrong on our side" }, 500);
  });
  return app;
}
