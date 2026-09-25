import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { getCookie } from "hono/cookie";
import { findSession, type SessionUser } from "./sessions.ts";
import type { Role } from "./schema.ts";
import type { Db } from "./db.ts";

export const COOKIE = "session";

export type Env = { Variables: { user: SessionUser | null } };
export type SignedInEnv = { Variables: { user: SessionUser } };

// Who's asking? Runs first, on every request.
export function currentUser(db: Db, now: () => Date) {
  return createMiddleware<Env>(async (c, next) => {
    const token = getCookie(c, COOKIE);
    c.set("user", token ? await findSession(db, token, now()) : null);
    await next();
  });
}

// 401 Unauthorized really means "unauthenticated": I don't know who you are. Log in and try again.
export const requireUser = createMiddleware<SignedInEnv>(async (c, next) => {
  if (!c.get("user")) throw new HTTPException(401, { message: "Log in first" });
  await next();
});

// 403 Forbidden: I know exactly who you are, and you're not allowed. Logging in again won't help.
export function requireRole(...roles: Role[]) {
  return createMiddleware<SignedInEnv>(async (c, next) => {
    const user = c.get("user");
    if (!user) throw new HTTPException(401, { message: "Log in first" });
    if (!roles.includes(user.role)) throw new HTTPException(403, { message: `Only ${roles.join(" or ")} accounts can do that` });
    await next();
  });
}
