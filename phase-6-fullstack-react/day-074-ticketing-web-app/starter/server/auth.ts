import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { users } from "./schema.ts";
import { hashPassword, verifyPassword, passwordProblem } from "./passwords.ts";
import { createSession, endSession } from "./sessions.ts";
import { COOKIE, type Env } from "./guards.ts";
import { readBody, fail } from "./http.ts";
import type { Db } from "./db.ts";

// Already written: Day 61's sign up, log in and log out, as routes the app mounts.
const SignupSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  name: z.string().trim().min(2, "Enter your name").max(60),
  password: z.string(),
});
const LoginSchema = z.object({ email: z.string().transform((e) => e.trim().toLowerCase()), password: z.string() });

let dummyHash: Promise<string> | undefined;
const dummy = () => (dummyHash ??= hashPassword("not-a-real-password-just-for-timing"));

export function authRoutes(options: { db: Db; now: () => Date; secureCookies: boolean }) {
  const { db, now } = options;

  const startSession = async (c: Parameters<typeof setCookie>[0], userId: number) => {
    const session = await createSession(db, userId, now());
    setCookie(c, COOKIE, session.token, { httpOnly: true, secure: options.secureCookies, sameSite: "Lax", path: "/", expires: session.expiresAt });
  };

  const app = new Hono<Env>();

  app.post("/signup", async (c) => {
    const input = await readBody(c, SignupSchema);
    const problem = passwordProblem(input.password, input);
    if (problem) fail(422, problem);
    const existing = await db.query.users.findFirst({ where: sql`${users.email} = ${input.email} COLLATE NOCASE` });
    if (existing) fail(409, "There's already an account with that email. Log in instead.");
    const [user] = await db
      .insert(users)
      .values({ email: input.email, name: input.name, passwordHash: await hashPassword(input.password), createdAt: now().toISOString() })
      .returning({ id: users.id, email: users.email, name: users.name, role: users.role });
    await startSession(c, user.id);
    return c.json({ user }, 201);
  });

  app.post("/login", async (c) => {
    const input = await readBody(c, LoginSchema);
    const user = await db.query.users.findFirst({ where: sql`${users.email} = ${input.email} COLLATE NOCASE` });
    const ok = await verifyPassword(input.password, user?.passwordHash ?? (await dummy()));
    if (!user || !ok) fail(401, "Email or password is wrong");
    await startSession(c, user.id);
    return c.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  });

  app.post("/logout", async (c) => {
    const token = getCookie(c, COOKIE);
    if (token) await endSession(db, token);
    deleteCookie(c, COOKIE, { path: "/" });
    return c.body(null, 204);
  });

  app.get("/me", (c) => {
    const user = c.get("user");
    if (!user) fail(401, "Log in first");
    return c.json({ user });
  });

  return app;
}
