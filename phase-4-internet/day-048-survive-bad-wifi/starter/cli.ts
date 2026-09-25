// Already written: fetch the live score from the flaky server, ten times, and watch the retries.
// Start the server first (in another terminal):
//   node phase-4-internet/day-048-survive-bad-wifi/starter/flaky-server.ts
//   node phase-4-internet/day-048-survive-bad-wifi/starter/cli.ts
import { fetchWithRetry } from "./resilient.ts";

for (let i = 1; i <= 10; i++) {
  const started = Date.now();
  try {
    const response = await fetchWithRetry("http://localhost:4848/score", {}, fetch, {
      timeoutMs: 2000,
      onRetry: ({ attempt, delayMs, reason }) => console.log(`   retry ${attempt} in ${delayMs} ms (${reason})`),
    });
    const body = await response.json();
    console.log(`${i}. ${response.status} ${JSON.stringify(body)} after ${Date.now() - started} ms`);
  } catch (error) {
    console.log(`${i}. ${error instanceof Error ? error.message : error}`);
  }
}
