// Already written: text every subscriber about ticket drops they haven't heard about.
//   node phase-4-internet/day-047-ticket-drop-sms/starter/cli.ts
// With AT_USERNAME and AT_API_KEY in .env it sends through Africa's Talking; without, it prints.
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { DropSchema } from "./drops.ts";
import { subscribersFrom } from "./subscribers.ts";
import { africasTalkingSender, consoleSms } from "./africas-talking.ts";
import { alertNewDrops } from "./alerts.ts";

const here = (file: string) => join(import.meta.dirname, file);
const lines = async (file: string) => (await readFile(here(file), "utf8")).split("\n").filter((l) => l.trim() !== "");

try {
  process.loadEnvFile(here(".env"));
} catch {
  // No .env: messages are printed instead of sent.
}

const drops = z.array(DropSchema).parse(JSON.parse(await readFile(here("drops.json"), "utf8")));
const { numbers, invalid } = subscribersFrom(await lines("subscribers.txt"), await lines("stopped.txt"));
if (invalid.length > 0) console.log(`Skipping numbers that don't look Kenyan: ${invalid.join(", ")}`);

let seen = new Set<string>();
try {
  seen = new Set(JSON.parse(await readFile(here("announced.json"), "utf8")));
} catch {
  // Nothing announced yet.
}

const { AT_USERNAME, AT_API_KEY, AT_FROM } = process.env;
const sender =
  AT_USERNAME && AT_API_KEY ? africasTalkingSender({ username: AT_USERNAME, apiKey: AT_API_KEY, from: AT_FROM }, fetch) : consoleSms();

const { reports, announced } = await alertNewDrops(drops, seen, numbers, sender);
for (const report of reports) {
  console.log(`${report.drop}: sent to ${report.sent}${report.failed.length ? `, failed: ${JSON.stringify(report.failed)}` : ""}`);
}
await writeFile(here("announced.json"), JSON.stringify([...seen, ...announced], null, 2));
console.log(announced.length === 0 ? "No new drops." : `Announced ${announced.length} drop(s).`);
