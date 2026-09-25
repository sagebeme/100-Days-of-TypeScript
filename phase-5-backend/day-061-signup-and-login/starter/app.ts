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
    // TODO: setCookie(c, COOKIE, session.token, { ... }) with:
    //   httpOnly: true (page JavaScript can't read it), secure: options.secureCookies ?? true,
    //   sameSite: "Lax", path: "/", expires: session.expiresAt
    void session;
  };

  // Who's asking? Runs on every request; routes that need a user check c.get("user").
  const currentUser = createMiddleware<Env>(async (c, next) => {
    // TODO: read the COOKIE; set "user" to findSession(...) for it, or null when there's no cookie
    c.set("user", null);
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

  // TODO: POST /login: find the user by email (any case). Check the password against their hash, or against
  //   `await dummy()` when there's no such user (so both take the same time). Either failure ->
  //   401 "Email or password is wrong" (the SAME message). Success -> startSession, then { user }.
  // TODO: POST /logout: end the session from the cookie (if any), deleteCookie(c, COOKIE, { path: "/" }), 204
  // TODO: GET /me: the current user, or 401 "Log in first"
  void [getCookie, deleteCookie, verifyPassword, findSession, endSession, LoginSchema, dummy];

  app.onError((error, c) =>
    error instanceof HTTPException ? c.json({ error: error.message }, error.status) : c.json({ error: "Something went wrong on our side" }, 500),
  );
  return app;
}
