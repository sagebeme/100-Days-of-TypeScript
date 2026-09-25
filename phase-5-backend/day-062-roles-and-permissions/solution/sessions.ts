import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lte } from "drizzle-orm";
import { sessions, users } from "./schema.ts";
import type { Db } from "./db.ts";
import type { Role } from "./schema.ts";

export const SESSION_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

// The database only ever sees the hash. The token itself lives only in the user's cookie.
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export async function createSession(db: Db, userId: number, now: Date): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url"); // 256 random bits: unguessable
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * DAY);
  await db.insert(sessions).values({ id: hashToken(token), userId, createdAt: now.toISOString(), expiresAt: expiresAt.toISOString() });
  return { token, expiresAt };
}

// The user a cookie belongs to, or null. Expired sessions are deleted when they're found.
export async function findSession(db: Db, token: string, now: Date): Promise<SessionUser | null> {
  const id = hashToken(token);
  const [row] = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, now.toISOString())));
  if (!row) {
    await db.delete(sessions).where(and(eq(sessions.id, id), lte(sessions.expiresAt, now.toISOString())));
    return null;
  }
  return row;
}

export async function endSession(db: Db, token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
}

// "Log out everywhere", for after a password change.
export async function endAllSessions(db: Db, userId: number): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
