import { z } from "zod";
import { load, weatherUrl, WeatherSchema, FixtureSchema, ReleaseSchema, type Fetcher } from "./sources.ts";
import { formatDigest, toSection } from "./digest.ts";
import type { Messenger } from "./telegram.ts";

// ------------------------------------------------------------------
// Config (Day 45): checked once, with every problem listed.
// ------------------------------------------------------------------
const ConfigSchema = z
  .object({
    TEAM: z.string().trim().min(1).default("Gor Mahia"),
    LATITUDE: z.coerce.number().min(-90).max(90).default(-1.2921),
    LONGITUDE: z.coerce.number().min(-180).max(180).default(36.8219),
    FIXTURES_SOURCE: z.string().min(1).default("fixtures.json"),
    RELEASES_SOURCE: z.string().min(1).default("releases.json"),
    SEND_AT: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "SEND_AT must be a time like 07:00")
      .default("07:00"),
    TELEGRAM_BOT_TOKEN: z.string().min(20, "TELEGRAM_BOT_TOKEN looks too short").optional(),
    TELEGRAM_CHAT_ID: z.string().min(1).optional(),
  });

export type BotConfig = z.infer<typeof ConfigSchema>;

export function loadBotConfig(env: Record<string, string | undefined>): BotConfig {
  const result = ConfigSchema.safeParse(env);
  const problems = result.success
    ? []
    : result.error.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message));
  // Checked separately: Zod skips whole-object checks when a single field has already failed,
  // and every problem should be listed at once.
  if ((env.TELEGRAM_BOT_TOKEN === undefined) !== (env.TELEGRAM_CHAT_ID === undefined)) {
    problems.push("Set both TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID, or neither (to print instead)");
  }
  if (!result.success || problems.length > 0) {
    throw new Error(`Bad configuration:\n  ${problems.join("\n  ")}`);
  }
  return result.data;
}

// ------------------------------------------------------------------
// One run: gather everything at once, build the digest, send it.
// ------------------------------------------------------------------
export interface RunDeps {
  fetchFn: Fetcher;
  readFile: (path: string) => Promise<string>;
  messenger: Messenger;
  now: () => Date;
}

export async function sendDigest(config: BotConfig, deps: RunDeps): Promise<string> {
  // TODO: load the weather (weatherUrl), the fixtures and the releases AT THE SAME TIME with
  //   Promise.allSettled, so one failing source can't stop the others
  // TODO: formatDigest with each result turned into a section (toSection), send it, and return the text
  throw new Error("not implemented yet");
}

// ------------------------------------------------------------------
// Scheduling: the next time it's SEND_AT in Nairobi.
// ------------------------------------------------------------------
const HOUR = 60 * 60 * 1000;

export function nextRunAt(now: Date, sendAt: string): Date {
  // TODO: today at SEND_AT in Nairobi time (UTC+3); if that's not in the future any more, tomorrow at SEND_AT
  throw new Error("not implemented yet");
}

export interface Timers {
  setTimeout(callback: () => void, ms: number): unknown;
}

export function runDaily(config: BotConfig, deps: RunDeps & { log: (line: string) => void }, timers: Timers = globalThis): void {
  // TODO: schedule(): log "Next drop at <ISO>", then setTimeout until nextRunAt. When it fires:
  //   sendDigest, log "Drop sent." (or "Couldn't send today's drop: <message>"), and schedule() again
  throw new Error("not implemented yet");
}
