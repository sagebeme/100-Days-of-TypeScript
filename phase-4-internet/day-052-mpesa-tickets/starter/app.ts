// Already written: run the ticket shop's payment server.
//   node phase-4-internet/day-052-mpesa-tickets/starter/app.ts
// With DARAJA_* settings in .env it talks to the real Daraja sandbox. Without them it runs in demo mode:
// no money moves, and you play Safaricom yourself with simulate-callback.ts.
import { join } from "node:path";
import { createDaraja, type Daraja } from "./daraja.ts";
import { createPaymentServer, type TicketEvent } from "./server.ts";

try {
  process.loadEnvFile(join(import.meta.dirname, ".env"));
} catch {
  // No .env: demo mode.
}

export const EVENTS: TicketEvent[] = [
  { id: "gengetone-night", title: "Gengetone Night", priceKes: 1000 },
  { id: "rooftop-listening", title: "Rooftop Listening Party", priceKes: 1500 },
];

const PORT = 3052;
const secret = process.env.CALLBACK_SECRET ?? "demo-secret";
const env = process.env;

let daraja: Daraja;
if (env.DARAJA_CONSUMER_KEY && env.DARAJA_CONSUMER_SECRET && env.PUBLIC_URL) {
  daraja = createDaraja(
    {
      consumerKey: env.DARAJA_CONSUMER_KEY,
      consumerSecret: env.DARAJA_CONSUMER_SECRET,
      shortcode: env.DARAJA_SHORTCODE ?? "174379",
      passkey: env.DARAJA_PASSKEY ?? "",
      callbackUrl: `${env.PUBLIC_URL}/mpesa/callback/${secret}`,
      environment: "sandbox",
    },
    fetch,
  );
  console.log("Using the Daraja sandbox.");
} else {
  let n = 0;
  daraja = {
    token: async () => "demo",
    stkPush: async () => {
      const checkoutRequestId = `ws_CO_DEMO_${++n}`;
      console.log(`\n[demo] Pretend a PIN prompt just appeared on the phone. To answer it:`);
      console.log(`  node phase-4-internet/day-052-mpesa-tickets/starter/simulate-callback.ts ${checkoutRequestId} paid`);
      return { merchantRequestId: `demo-${n}`, checkoutRequestId, customerMessage: "Success. Request accepted for processing" };
    },
  };
  console.log("Demo mode: no Daraja settings in .env, so no real payments.");
}

const { server } = createPaymentServer({ daraja, events: EVENTS, callbackSecret: secret, log: console.log });
server.listen(PORT, () => {
  console.log(`Ticket shop on http://localhost:${PORT}`);
  console.log(`Buy: curl -X POST localhost:${PORT}/events/gengetone-night/tickets -H 'Content-Type: application/json' -d '{"phone":"0712345678","quantity":2}'`);
});
