// Already written: a pretend exchange-rate API for practising with keys, so nobody has to sign up
// for anything. It behaves like a real one: no key or a wrong key gets a 401.
//   node phase-4-internet/day-045-real-cost/starter/fake-rates-server.ts
import { createServer } from "node:http";

export const PORT = 4545;
export const VALID_KEY = "dev-key-2026-practice";

export const server = createServer((request, response) => {
  const send = (status: number, body: unknown) => {
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(JSON.stringify(body));
  };

  if (request.url !== "/latest") {
    return send(404, { error: "not found" });
  }
  if (request.headers.authorization !== `Bearer ${VALID_KEY}`) {
    return send(401, { error: "invalid or missing API key" });
  }
  send(200, { base: "USD", updated: new Date().toISOString(), rates: { KES: 129.35, EUR: 0.92, UGX: 3705.5 } });
});

// Only listen when run directly, not when a test imports this file.
if (import.meta.main) {
  server.listen(PORT, () => {
    console.log(`Fake rates API on http://localhost:${PORT}/latest`);
    console.log(`The key it accepts: ${VALID_KEY}`);
  });
}
