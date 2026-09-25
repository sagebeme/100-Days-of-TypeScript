// Already written: run the Hono version of the stage API on a real port.
//   node phase-5-backend/day-056-routes-and-middleware/starter/main.ts
//   curl -i localhost:3056/stages/kencom      (look for the X-Request-Id header)
import { serve } from "@hono/node-server";
import { createApp, type Stage } from "./app.ts";

const STAGES: Stage[] = [
  { id: "kencom", name: "Kencom", routes: ["33", "34", "46"] },
  { id: "ambassadeur", name: "Ambassadeur", routes: ["111", "125", "126"] },
  { id: "odeon", name: "Odeon", routes: ["44", "45", "237"] },
  { id: "railways", name: "Railways", routes: ["33", "58"] },
];

const app = createApp({ stages: STAGES, log: console.log });
const server = serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3056) }, (info) => {
  console.log(`Stage API (Hono) on http://localhost:${info.port}`);
});

process.on("SIGINT", () => server.close(() => process.exit(0)));
