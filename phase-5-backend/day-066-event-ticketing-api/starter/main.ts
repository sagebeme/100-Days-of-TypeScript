// Already written: run the ticketing API.
//   node phase-5-backend/day-066-event-ticketing-api/starter/main.ts
// With no Daraja keys it runs in demo mode: no real M-Pesa, and you send the payment result
// yourself with simulate-callback.ts. See the README for a full walk through with curl.
import { join } from "node:path";
import { serve } from "@hono/node-server";
import { openDatabase } from "./db.ts";
import { migrate, readMigrations } from "./migrate.ts";
import { createApp } from "./app.ts";
import { createDaraja } from "./daraja.ts";
import { darajaPayments, demoPayments, type Payments } from "./payments.ts";

const env = process.env;
const production = env.NODE_ENV === "production";
const need = (name: string, devDefault: string) => {
  const value = env[name] ?? (production ? undefined : devDefault);
  if (!value) {
    console.error(`Set ${name}: production never falls back to a default secret`);
    process.exit(1);
  }
  return value;
};

const database = openDatabase(env.DATABASE_PATH ?? join(import.meta.dirname, "tickets.db"));
migrate(database.sqlite, readMigrations(join(import.meta.dirname, "migrations")));

let payments: Payments;
if (env.DARAJA_CONSUMER_KEY) {
  payments = darajaPayments(
    createDaraja(
      {
        consumerKey: env.DARAJA_CONSUMER_KEY,
        consumerSecret: need("DARAJA_CONSUMER_SECRET", ""),
        shortcode: env.DARAJA_SHORTCODE ?? "174379",
        passkey: need("DARAJA_PASSKEY", ""),
        callbackUrl: need("DARAJA_CALLBACK_URL", ""), // https://your-app.example/payments/mpesa/<CALLBACK_TOKEN>
        environment: env.DARAJA_ENVIRONMENT === "production" ? "production" : "sandbox",
      },
      fetch,
    ),
  );
} else {
  const demo = demoPayments();
  payments = {
    async start(request) {
      const started = await demo.start(request);
      console.log(`Demo payment ${started.checkoutRequestId}: KES ${request.amount} from ${request.phone}. Send its result with simulate-callback.ts`);
      return started;
    },
  };
}

const app = createApp({
  database,
  payments,
  ticketSecret: need("TICKET_SECRET", "dev-only-ticket-secret"),
  callbackToken: need("CALLBACK_TOKEN", "demo-callback"),
  secureCookies: production,
});
serve({ fetch: app.fetch, port: Number(env.PORT ?? 3066) }, (info) => console.log(`Ticketing API on http://localhost:${info.port}`));
