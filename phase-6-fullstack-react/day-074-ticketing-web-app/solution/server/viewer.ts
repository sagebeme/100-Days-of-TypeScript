import { cookies } from "next/headers";
import { getServer } from "./context.ts";
import { findSession, type SessionUser } from "./sessions.ts";
import { COOKIE } from "./guards.ts";

// Who's looking at this page? Server components ask here: the same session cookie the API uses
// (Day 61), read on the server, so the page arrives already knowing who you are.
export async function getViewer(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const { database, now } = await getServer();
  return findSession(database.db, token, now());
}
