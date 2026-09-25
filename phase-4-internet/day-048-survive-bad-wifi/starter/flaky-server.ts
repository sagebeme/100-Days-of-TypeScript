// Already written: a server as unreliable as Wi-Fi at a matatu stage.
//   node phase-4-internet/day-048-survive-bad-wifi/starter/flaky-server.ts
// About half the requests fail: some with a 503, some with a 429 and a Retry-After,
// some hang for 10 seconds, and some drop the connection.
import { createServer } from "node:http";

export const PORT = 4848;

export const server = createServer((request, response) => {
  const roll = Math.random();
  if (roll < 0.15) {
    response.writeHead(503, { "Content-Type": "application/json" });
    return response.end(JSON.stringify({ error: "busy" }));
  }
  if (roll < 0.25) {
    response.writeHead(429, { "Content-Type": "application/json", "Retry-After": "1" });
    return response.end(JSON.stringify({ error: "slow down" }));
  }
  if (roll < 0.35) {
    setTimeout(() => response.end("{}"), 10_000); // hangs: only a timeout saves you
    return;
  }
  if (roll < 0.45) {
    return request.socket.destroy(); // the connection just drops
  }
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ match: "Gor Mahia 2 - 1 AFC Leopards", minute: 78 }));
});

if (import.meta.main) {
  server.listen(PORT, () => console.log(`Flaky server on http://localhost:${PORT}/score`));
}
