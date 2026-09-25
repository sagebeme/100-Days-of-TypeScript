import { join } from "node:path";
import { openDatabase, type Database } from "./db.ts";
import { migrate, readMigrations } from "./migrate.ts";
import { createSession } from "./sessions.ts";
import { createApp, type AppOptions } from "./app.ts";
import { COOKIE } from "./guards.ts";
import type { Role } from "./schema.ts";

export interface Reply {
  status: number;
  body: any; // `any` on purpose: tests poke at whatever came back, and a wrong guess fails the test anyway
}

// Talks to the app as one person (or as nobody). No server, no ports: app.request() under the hood.
export interface Client {
  get(path: string): Promise<Reply>;
  post(path: string, body?: unknown): Promise<Reply>;
  put(path: string, body?: unknown): Promise<Reply>;
  patch(path: string, body?: unknown): Promise<Reply>;
  delete(path: string): Promise<Reply>;
}

export interface TestKit {
  app: ReturnType<typeof createApp>;
  database: Database;
  now(): Date;
  advance(ms: number): void;
  addUser(name: string, role: Role): Promise<number>;
  as(name?: string): Client; // no name: logged out
  createEvent(owner: string, overrides?: Partial<{ title: string; venue: string; startsAt: string }>): Promise<number>;
  close(): void;
}

export const MIGRATIONS = join(import.meta.dirname, "migrations");

// Every test gets its own brand-new database, clock and app: nothing leaks from one test into another.
export async function createKit(overrides: Partial<AppOptions> = {}): Promise<TestKit> {
  const database = openDatabase(":memory:");
  migrate(database.sqlite, readMigrations(MIGRATIONS));
  let clock = new Date("2026-10-05T09:00:00Z");
  const app = createApp({ db: database.db, now: () => clock, ...overrides });
  const cookies = new Map<string, string>();

  const client = (cookie?: string): Client => {
    const send = async (method: string, path: string, body?: unknown): Promise<Reply> => {
      const headers: Record<string, string> = {};
      if (cookie) headers.Cookie = cookie;
      if (body !== undefined) headers["Content-Type"] = "application/json";
      const response = await app.request(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
      const text = await response.text();
      return { status: response.status, body: text ? JSON.parse(text) : null };
    };
    return {
      get: (path) => send("GET", path),
      post: (path, body) => send("POST", path, body),
      put: (path, body) => send("PUT", path, body),
      patch: (path, body) => send("PATCH", path, body),
      delete: (path) => send("DELETE", path),
    };
  };

  const kit: TestKit = {
    app,
    database,
    now: () => clock,
    advance(ms) {
      clock = new Date(clock.getTime() + ms);
    },
    // A factory: one line gives a test a logged-in user with any role, skipping the sign-up form.
    async addUser(name, role) {
      database.sqlite
        .prepare("INSERT INTO users (email, name, password_hash, created_at, role) VALUES (?, ?, 'not-used', ?, ?)")
        .run(`${name.toLowerCase()}@example.com`, name, clock.toISOString(), role);
      const { id } = database.sqlite.prepare("SELECT id FROM users WHERE name = ?").get(name) as { id: number };
      const { token } = await createSession(database.db, id, clock);
      cookies.set(name, `${COOKIE}=${token}`);
      return id;
    },
    as(name) {
      if (name !== undefined && !cookies.has(name)) throw new Error(`No test user called ${name}: call addUser first`);
      return client(name === undefined ? undefined : cookies.get(name));
    },
    async createEvent(owner, fields = {}) {
      const reply = await kit.as(owner).post("/events", {
        title: "Gengetone Night",
        venue: "Alchemist",
        startsAt: "2026-10-10T18:00:00Z",
        ...fields,
      });
      if (reply.status !== 201) throw new Error(`createEvent failed with ${reply.status}: ${JSON.stringify(reply.body)}`);
      return reply.body.id;
    },
    close: () => database.close(),
  };
  return kit;
}
