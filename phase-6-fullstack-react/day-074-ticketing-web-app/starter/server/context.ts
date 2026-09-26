import { Hono } from "hono";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase, type Database } from "./db.ts";
import { migrate } from "./migrate.ts";
import { MIGRATIONS } from "./migrations.ts";
import { seed } from "./seed.ts";
import { createApp } from "./app.ts";
import { devRoutes } from "./dev.ts";
import { createDaraja } from "./daraja.ts";
import { darajaPayments, demoPayments, type Payments } from "./payments.ts";

export interface TikitiServer {
  database: Database;
  api: Hono; // Day 66's API, answering under /api
  ticketSecret: string;
  now: () => Date;
}

// TODO: one server per process, made the first time it's asked for.
// Next's dev server reloads modules on every save, so keep the promise on globalThis
// (globalThis.__tikiti ??= start()), or every save opens another database connection.
export function getServer(): Promise<TikitiServer> {
  return Promise.reject(new Error("TODO: getServer"));
}

// TODO: for tests: forget the instance (and close its database), so the next getServer() starts fresh.
export async function resetServer(): Promise<void> {}

// TODO: start the server:
// - settings: in production, a missing TICKET_SECRET, CALLBACK_TOKEN or DARAJA_ setting is an error
//   (Day 65: never fall back to a default secret). Otherwise use "dev-only-ticket-secret" and "dev-callback".
// - the database: DATABASE_PATH, or ":memory:" when NODE_ENV is "test", or join(tmpdir(), "tikiti-day-074.db").
//   migrate(database.sqlite, MIGRATIONS), and seed(database) when not in production.
// - payments: Daraja when DARAJA_CONSUMER_KEY is set (see Day 66's main.ts), otherwise demoPayments()
//   (and in production, that's an error: production takes real payments).
// - api: createApp({ database, payments, ticketSecret, callbackToken, now, secureCookies: production }),
//   plus api.route("/", devRoutes(database, now)) when not in production (the sandbox buttons),
//   all under /api: new Hono().basePath("/api").route("/", api).
async function start(): Promise<TikitiServer> {
  void [Hono, tmpdir, join, openDatabase, migrate, MIGRATIONS, seed, createApp, devRoutes, createDaraja, darajaPayments, demoPayments];
  void (null as unknown as Payments);
  throw new Error("TODO: start");
}
void start;
