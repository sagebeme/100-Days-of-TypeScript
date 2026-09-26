import { cookies } from "next/headers";
import { getServer } from "./context.ts";
import { findSession, type SessionUser } from "./sessions.ts";
import { COOKIE } from "./guards.ts";

// TODO: who's looking at this page? Read the session cookie with (await cookies()).get(COOKIE), and
// look it up with findSession (Day 61). No cookie, or an unknown one: null.
export async function getViewer(): Promise<SessionUser | null> {
  void [cookies, getServer, findSession, COOKIE];
  return null;
}
