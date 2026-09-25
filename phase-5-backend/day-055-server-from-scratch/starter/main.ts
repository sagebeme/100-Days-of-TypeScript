// Already written: start the stage-crowd API.
//   node phase-5-backend/day-055-server-from-scratch/starter/main.ts
// Then, in another terminal:
//   curl localhost:3055/stages?route=46
//   curl -X POST localhost:3055/stages/kencom/reports -H 'Content-Type: application/json' -d '{"crowd":"packed"}'
//   curl localhost:3055/stages/kencom
import { createApp, type Stage } from "./app.ts";

export const STAGES: Stage[] = [
  { id: "kencom", name: "Kencom", routes: ["33", "34", "46"] },
  { id: "ambassadeur", name: "Ambassadeur", routes: ["111", "125", "126"] },
  { id: "odeon", name: "Odeon", routes: ["44", "45", "237"] },
  { id: "railways", name: "Railways", routes: ["33", "58"] },
  { id: "ronald-ngala", name: "Ronald Ngala Street", routes: ["58", "105"] },
];

const PORT = Number(process.env.PORT ?? 3055);
const server = createApp({ stages: STAGES, log: console.log });
server.listen(PORT, () => console.log(`Stage API on http://localhost:${PORT}`));

// Ctrl+C: stop taking new requests, finish the ones in progress, then exit.
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  server.close(() => process.exit(0));
});
