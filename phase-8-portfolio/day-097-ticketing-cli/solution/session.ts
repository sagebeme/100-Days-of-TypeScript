import { mkdir, readFile, rm, writeFile, chmod } from "node:fs/promises";
import { join } from "node:path";

// Staying logged in between commands: the session cookie, saved where config files belong, readable
// only by you.

export interface Session {
  baseUrl: string; // which API this cookie is for
  cookie: string; // "session=…"
  name: string;
  email: string;
}

// $XDG_CONFIG_HOME/tikiti if it's set (the Linux convention), otherwise ~/.config/tikiti.
export function configDir(env: Record<string, string | undefined>, home: string): string {
  return join(env.XDG_CONFIG_HOME || join(home, ".config"), "tikiti");
}

// From "session=abc123; Path=/; HttpOnly; SameSite=Lax" keep "session=abc123": the part to send back.
export function sessionCookie(setCookie: string | null, name = "session"): string | null {
  if (!setCookie) return null;
  for (const cookie of setCookie.split(/,(?=\s*[^;=\s]+=)/)) {
    const [pair] = cookie.trim().split(";");
    const [key, value] = [pair.slice(0, pair.indexOf("=")), pair.slice(pair.indexOf("=") + 1)];
    if (key === name && value) return `${key}=${value}`;
  }
  return null;
}

export async function saveSession(dir: string, session: Session): Promise<void> {
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const file = join(dir, "session.json");
  // The mode on writeFile only applies when it creates the file, so set it again for an old one.
  await writeFile(file, JSON.stringify(session, null, 2) + "\n", { mode: 0o600 });
  await chmod(file, 0o600);
}

// A missing, unreadable or mangled file just means "not logged in".
export async function loadSession(dir: string, baseUrl: string): Promise<Session | null> {
  try {
    const session = JSON.parse(await readFile(join(dir, "session.json"), "utf8")) as Partial<Session>;
    if (typeof session.cookie !== "string" || typeof session.name !== "string" || typeof session.email !== "string") return null;
    if (session.baseUrl !== baseUrl) return null; // never send one server's cookie to another
    return session as Session;
  } catch {
    return null;
  }
}

export async function clearSession(dir: string): Promise<void> {
  await rm(join(dir, "session.json"), { force: true });
}
