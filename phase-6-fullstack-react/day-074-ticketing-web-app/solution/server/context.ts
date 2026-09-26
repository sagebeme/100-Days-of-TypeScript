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

// One server per process. Next's dev server reloads modules on every save; keeping the instance on
// globalThis means a save doesn't open a second database connection (or a tenth).
const globalForTikiti = globalThis as typeof globalThis & { __tikiti?: Promise<TikitiServer> };

export function getServer(): Promise<TikitiServer> {
  return (globalForTikiti.__tikiti ??= start());
}

// For tests: throw the instance away, so the next getServer() starts fresh.
export async function resetServer(): Promise<void> {
  const current = globalForTikiti.__tikiti;
  globalForTikiti.__tikiti = undefined;
  (await current)?.database.close();
}

async function start(): Promise<TikitiServer> {
  const env = process.env;
  const production = env.NODE_ENV === "production";
  // Production never falls back to a default secret (Day 65).
  const setting = (name: string, fallback: string): string => {
    const value = env[name] ?? (production ? undefined : fallback);
    if (!value) throw new Error(`Set ${name}: production never falls back to a default`);
    return value;
  };

  const database = openDatabase(env.DATABASE_PATH ?? (env.NODE_ENV === "test" ? ":memory:" : join(tmpdir(), "tikiti-day-074.db")));
  migrate(database.sqlite, MIGRATIONS);
  if (!production) await seed(database);

  let payments: Payments;
  if (env.DARAJA_CONSUMER_KEY) {
    const daraja = createDaraja(
      {
        consumerKey: env.DARAJA_CONSUMER_KEY,
        consumerSecret: setting("DARAJA_CONSUMER_SECRET", ""),
        shortcode: env.DARAJA_SHORTCODE ?? "174379",
        passkey: setting("DARAJA_PASSKEY", ""),
        callbackUrl: setting("DARAJA_CALLBACK_URL", ""),
        environment: env.DARAJA_ENVIRONMENT === "production" ? "production" : "sandbox",
      },
      fetch,
    );
    payments = darajaPayments(daraja);
  } else {
    if (production) throw new Error("Set the DARAJA_ settings: production takes real payments");
    payments = demoPayments();
  }

  const now = () => new Date();
  const ticketSecret = setting("TICKET_SECRET", "dev-only-ticket-secret");
  const api = createApp({ database, payments, ticketSecret, callbackToken: setting("CALLBACK_TOKEN", "dev-callback"), now, secureCookies: production });
  if (!production) api.route("/", devRoutes(database, now)); // the M-Pesa sandbox buttons
  return { database, api: new Hono().basePath("/api").route("/", api), ticketSecret, now };
}
