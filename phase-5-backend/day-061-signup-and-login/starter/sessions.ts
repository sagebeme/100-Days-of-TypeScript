import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lte } from "drizzle-orm";
import { sessions, users } from "./schema.ts";
import type { Db } from "./db.ts";

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
}

export async function createSession(db: Db, userId: number, now: Date): Promise<{ token: string; expiresAt: Date }> {
  // TODO: a token of 32 random bytes as base64url; it expires SESSION_DAYS from now.
  //   Store hashToken(token) as the session id (never the token), and return the token and expiry.
  throw new Error("not implemented yet");
}

// The user a cookie belongs to, or null. Expired sessions are deleted when they're found.
export async function findSession(db: Db, token: string, now: Date): Promise<SessionUser | null> {
  // TODO: join sessions to users on the hashed token, where expiresAt is after now -> { id, email, name }
  // TODO: nothing found -> delete the session if it's expired, and return null
  void [and, eq, gt, lte, sessions, users, randomBytes, DAY];
  throw new Error("not implemented yet");
}

export async function endSession(db: Db, token: string): Promise<void> {
  // TODO: delete the session with this token's hash
  throw new Error("not implemented yet");
}

// "Log out everywhere", for after a password change.
export async function endAllSessions(db: Db, userId: number): Promise<void> {
  // TODO: delete every session of this user
  throw new Error("not implemented yet");
}
