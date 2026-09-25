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
  const cookies = new Map<string, string>(); // user name -> "session=<token>"

  // TODO: client(cookie?): a Client whose get/post/put/patch/delete call app.request(path, ...) with
  //   the Cookie header (if any), Content-Type: application/json when there's a body, the body as JSON,
  //   and return { status, body } where body is the parsed JSON, or null for an empty response
  // TODO: advance(ms): move the clock forward
  // TODO: addUser(name, role): INSERT the user straight into the database (email: "<name lowercased>@example.com",
  //   any password_hash), make a session for them with createSession, remember their cookie
  //   (`${COOKIE}=${token}`), and return their id
  // TODO: as(name?): a Client with that user's cookie, or with none when there's no name.
  //   An unknown name -> throw `No test user called <name>: call addUser first`
  // TODO: createEvent(owner, fields?): POST /events as the owner with defaults (title "Gengetone Night",
  //   venue "Alchemist", startsAt "2026-10-10T18:00:00Z") overridden by `fields`. Anything but 201 ->
  //   throw `createEvent failed with <status>: <body as JSON>`. Return the new id.
  void [createSession, COOKIE, cookies, app];
  throw new Error("not implemented yet");
}
