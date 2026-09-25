// Already written: before scraping a site, find its API and read its robots.txt.
//   node phase-4-internet/day-049-find-the-api/starter/cli.ts
//   node phase-4-internet/day-049-find-the-api/starter/cli.ts my-recording.har robots.txt
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { findJsonEndpoints, asFetchCode } from "./har.ts";
import { parseRobots, isAllowed, crawlDelay } from "./robots.ts";

const [harFile = "duka.har", robotsFile = "robots.txt"] = process.argv.slice(2);
const read = (file: string) => readFile(file.includes("/") ? file : join(import.meta.dirname, file), "utf8");
const USER_AGENT = "FitCheckBot/1.0 (you@example.com)";

const endpoints = findJsonEndpoints(JSON.parse(await read(harFile)));
console.log(`The page loaded its data from ${endpoints.length} JSON endpoint(s):\n`);
for (const endpoint of endpoints) {
  const query = endpoint.query.length > 0 ? `?${endpoint.query.join("&")}` : "";
  console.log(`  ${endpoint.method} ${endpoint.host}${endpoint.path}${query}  (${endpoint.calls}x, ~${endpoint.averageMs} ms)`);
}

const robots = parseRobots(await read(robotsFile));
console.log(`\nWhat robots.txt says to ${USER_AGENT}:`);
for (const endpoint of endpoints) {
  const allowed = isAllowed(robots, USER_AGENT, endpoint.path);
  console.log(`  ${allowed ? "allowed    " : "DISALLOWED "} ${endpoint.path}`);
}
console.log(`  wait at least ${crawlDelay(robots, USER_AGENT) ?? 1} s between requests`);

const first = endpoints.find((e) => isAllowed(robots, USER_AGENT, e.path));
if (first) {
  console.log(`\nTry the API instead of scraping HTML:\n\n${asFetchCode(first)}`);
}
