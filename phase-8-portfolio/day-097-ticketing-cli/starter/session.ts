// Staying logged in between commands: the session cookie, saved where config files belong, readable
// only by you. The tests are the spec. node:fs/promises has everything you need.

export interface Session {
  baseUrl: string; // which API this cookie is for
  cookie: string; // "session=…"
  name: string;
  email: string;
}

// $XDG_CONFIG_HOME/tikiti if it's set, otherwise ~/.config/tikiti.
export function configDir(env: Record<string, string | undefined>, home: string): string {
  throw new Error(`TODO: configDir(${env.XDG_CONFIG_HOME}, ${home})`);
}

// From "session=abc123; Path=/; HttpOnly" keep "session=abc123": the part to send back.
export function sessionCookie(setCookie: string | null, name = "session"): string | null {
  throw new Error(`TODO: sessionCookie(${setCookie}, ${name})`);
}

// dir/session.json, with mode 0o600.
export async function saveSession(dir: string, session: Session): Promise<void> {
  throw new Error(`TODO: saveSession(${dir}, ${session.email})`);
}

// Missing, mangled, or for a different baseUrl: null.
export async function loadSession(dir: string, baseUrl: string): Promise<Session | null> {
  throw new Error(`TODO: loadSession(${dir}, ${baseUrl})`);
}

export async function clearSession(dir: string): Promise<void> {
  throw new Error(`TODO: clearSession(${dir})`);
}
