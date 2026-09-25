// Already written: start the daily drop bot.
//   node phase-4-internet/day-054-daily-drop-bot/starter/main.ts --now    (send one drop straight away)
//   node phase-4-internet/day-054-daily-drop-bot/starter/main.ts          (keep running; one drop a day at SEND_AT)
// Without Telegram settings in .env, the drop is printed instead of sent.
import { readFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { loadBotConfig, sendDigest, runDaily } from "./bot.ts";
import { telegramMessenger, consoleMessenger } from "./telegram.ts";
import { fetchWithRetry } from "./resilient.ts";

try {
  process.loadEnvFile(join(import.meta.dirname, ".env"));
} catch {
  // No .env: defaults, and printing instead of sending.
}

try {
  const config = loadBotConfig(process.env);
  const deps = {
    // Day 48's retrying fetch, so a flaky morning connection doesn't cost you the drop.
    fetchFn: (url: string, init?: RequestInit) => fetchWithRetry(url, init ?? {}, fetch, { timeoutMs: 10_000 }),
    readFile: (path: string) => readFile(isAbsolute(path) ? path : join(import.meta.dirname, path), "utf8"),
    messenger:
      config.TELEGRAM_BOT_TOKEN && config.TELEGRAM_CHAT_ID
        ? telegramMessenger(config.TELEGRAM_BOT_TOKEN, config.TELEGRAM_CHAT_ID, fetch)
        : consoleMessenger(),
    now: () => new Date(),
    log: console.log,
  };

  if (process.argv.includes("--now")) {
    await sendDigest(config, deps);
  } else {
    runDaily(config, deps);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
