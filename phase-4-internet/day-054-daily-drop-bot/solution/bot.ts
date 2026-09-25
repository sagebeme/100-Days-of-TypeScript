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
  // All three at the same time, and allSettled so one failure can't sink the others.
  const [weather, fixtures, releases] = await Promise.allSettled([
    load(weatherUrl(config.LATITUDE, config.LONGITUDE), WeatherSchema, deps.fetchFn, deps.readFile),
    load(config.FIXTURES_SOURCE, z.array(FixtureSchema), deps.fetchFn, deps.readFile),
    load(config.RELEASES_SOURCE, z.array(ReleaseSchema), deps.fetchFn, deps.readFile),
  ]);
  const text = formatDigest({
    date: deps.now(),
    team: config.TEAM,
    weather: toSection(weather),
    fixtures: toSection(fixtures),
    releases: toSection(releases),
  });
  await deps.messenger.send(text);
  return text;
}

// ------------------------------------------------------------------
// Scheduling: the next time it's SEND_AT in Nairobi.
// ------------------------------------------------------------------
const HOUR = 60 * 60 * 1000;

export function nextRunAt(now: Date, sendAt: string): Date {
  const [hours, minutes] = sendAt.split(":").map(Number);
  const nairobiNow = new Date(now.getTime() + 3 * HOUR);
  let run = Date.UTC(nairobiNow.getUTCFullYear(), nairobiNow.getUTCMonth(), nairobiNow.getUTCDate(), hours, minutes) - 3 * HOUR;
  if (run <= now.getTime()) run += 24 * HOUR;
  return new Date(run);
}

export interface Timers {
  setTimeout(callback: () => void, ms: number): unknown;
}

export function runDaily(config: BotConfig, deps: RunDeps & { log: (line: string) => void }, timers: Timers = globalThis): void {
  const schedule = () => {
    const next = nextRunAt(deps.now(), config.SEND_AT);
    deps.log(`Next drop at ${next.toISOString()}`);
    timers.setTimeout(async () => {
      try {
        await sendDigest(config, deps);
        deps.log("Drop sent.");
      } catch (error) {
        deps.log(`Couldn't send today's drop: ${error instanceof Error ? error.message : error}`);
      }
      schedule();
    }, next.getTime() - deps.now().getTime());
  };
  schedule();
}
