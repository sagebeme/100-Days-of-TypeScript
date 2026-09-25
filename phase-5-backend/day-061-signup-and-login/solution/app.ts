import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { users } from "./schema.ts";
import { hashPassword, verifyPassword, passwordProblem } from "./passwords.ts";
import { createSession, findSession, endSession, type SessionUser } from "./sessions.ts";
import type { Db } from "./db.ts";

export const COOKIE = "session";

export interface AuthOptions {
  db: Db;
  now?: () => Date;
  secureCookies?: boolean; // true in production (HTTPS); false on http://localhost
}

type Env = { Variables: { user: SessionUser | null } };

const SignupSchema = z.object({
  // Tidy first, then check: people paste emails with spaces and capitals.
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  name: z.string().trim().min(2, "Enter your name").max(60),
  password: z.string(),
});
const LoginSchema = z.object({ email: z.string().transform((e) => e.trim().toLowerCase()), password: z.string() });

async function body<S extends z.ZodType>(c: { req: { json(): Promise<unknown> } }, schema: S): Promise<z.output<S>> {
  const result = schema.safeParse(await c.req.json().catch(() => null));
  if (!result.success) throw new HTTPException(422, { message: result.error.issues[0].message });
  return result.data;
}

// Checked against when the email doesn't exist, so "no such user" takes as long as "wrong password".
// Made the first time it's needed, then reused.
let dummyHash: Promise<string> | undefined;
const dummy = () => (dummyHash ??= hashPassword("not-a-real-password-just-for-timing"));

export function createApp(options: AuthOptions) {
  const { db } = options;
  const now = options.now ?? (() => new Date());

  const startSession = async (c: Parameters<typeof setCookie>[0], userId: number) => {
    const session = await createSession(db, userId, now());
    setCookie(c, COOKIE, session.token, {
      httpOnly: true, // JavaScript on the page can't read it, so an XSS bug can't steal it
      secure: options.secureCookies ?? true, // only sent over HTTPS
      sameSite: "Lax", // not sent with form posts from other sites (CSRF)
      path: "/",
      expires: session.expiresAt,
    });
  };

  // Who's asking? Runs on every request; routes that need a user check c.get("user").
  const currentUser = createMiddleware<Env>(async (c, next) => {
    const token = getCookie(c, COOKIE);
    c.set("user", token ? await findSession(db, token, now()) : null);
    await next();
  });

  const app = new Hono<Env>().use(currentUser);

  app.post("/signup", async (c) => {
    const input = await body(c, SignupSchema);
    const problem = passwordProblem(input.password, input);
    if (problem) throw new HTTPException(422, { message: problem });
    const existing = await db.query.users.findFirst({ where: sql`${users.email} = ${input.email} COLLATE NOCASE` });
    if (existing) throw new HTTPException(409, { message: "There's already an account with that email. Log in instead." });

    const [user] = await db
      .insert(users)
      .values({ email: input.email, name: input.name, passwordHash: await hashPassword(input.password), createdAt: now().toISOString() })
      .returning({ id: users.id, email: users.email, name: users.name });
    await startSession(c, user.id);
    return c.json({ user }, 201);
  });

  app.post("/login", async (c) => {
    const input = await body(c, LoginSchema);
    const user = await db.query.users.findFirst({ where: sql`${users.email} = ${input.email} COLLATE NOCASE` });
    const ok = await verifyPassword(input.password, user?.passwordHash ?? (await dummy()));
    // The same answer for "no such email" and "wrong password": never tell an attacker which emails exist.
    if (!user || !ok) throw new HTTPException(401, { message: "Email or password is wrong" });
    await startSession(c, user.id);
    return c.json({ user: { id: user.id, email: user.email, name: user.name } });
  });

  app.post("/logout", async (c) => {
    const token = getCookie(c, COOKIE);
    if (token) await endSession(db, token);
    deleteCookie(c, COOKIE, { path: "/" });
    return c.body(null, 204);
  });

  app.get("/me", (c) => {
    const user = c.get("user");
    if (!user) throw new HTTPException(401, { message: "Log in first" });
    return c.json({ user });
  });

  app.onError((error, c) =>
    error instanceof HTTPException ? c.json({ error: error.message }, error.status) : c.json({ error: "Something went wrong on our side" }, 500),
  );
  return app;
}
