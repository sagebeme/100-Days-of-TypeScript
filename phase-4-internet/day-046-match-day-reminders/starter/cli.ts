// Already written: remind yourself about your team's matches.
//   node phase-4-internet/day-046-match-day-reminders/starter/cli.ts Arsenal          (keeps running)
//   node phase-4-internet/day-046-match-day-reminders/starter/cli.ts Arsenal --once   (sends what's due, then stops)
// With RESEND_API_KEY, EMAIL_FROM and EMAIL_TO in .env it sends real email; without, it prints instead.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { FixtureSchema, followed } from "./schedule.ts";
import { consoleSender, resendSender } from "./email.ts";
import { sendDue, runForever } from "./runner.ts";

try {
  process.loadEnvFile(join(import.meta.dirname, ".env"));
} catch {
  // No .env: fine, emails are printed instead of sent.
}

const args = process.argv.slice(2);
const once = args.includes("--once");
const team = args.filter((arg) => arg !== "--once").join(" ") || "Arsenal";

const fixtures = followed(
  z.array(FixtureSchema).parse(JSON.parse(await readFile(join(import.meta.dirname, "fixtures.json"), "utf8"))),
  team,
);
console.log(`Following ${team}: ${fixtures.length} upcoming match(es).`);

const key = process.env.RESEND_API_KEY;
const sender = key ? resendSender(key, process.env.EMAIL_FROM ?? "onboarding@resend.dev", fetch) : consoleSender();
const options = {
  fixtures,
  to: process.env.EMAIL_TO ?? "you@example.com",
  sender,
  sentPath: join(import.meta.dirname, "sent.json"),
  now: () => new Date(),
  log: console.log,
};

if (once) {
  console.log(`Sent ${await sendDue(options)} reminder(s).`);
} else {
  runForever(options);
}
