import { Hono } from "hono";
import type { BotOptions } from "./bot.ts";

export interface AppOptions {
  publicKey: string;
  bot: BotOptions;
  now?: () => number;
}

// POST /interactions: verify, then answer. A bad signature gets a 401. The tests are the spec.
export function createApp({ publicKey, bot, now = Date.now }: AppOptions) {
  const app = new Hono();
  app.post("/interactions", (c) => c.text(`TODO: ${publicKey.length} ${bot.siteUrl} ${now()}`, 501));
  return app;
}
