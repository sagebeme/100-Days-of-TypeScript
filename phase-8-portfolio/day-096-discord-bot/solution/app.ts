import { Hono } from "hono";
import { handleInteraction, type BotOptions } from "./bot.ts";
import type { Interaction } from "./discord.ts";
import { verifyDiscordRequest } from "./verify.ts";

export interface AppOptions {
  publicKey: string;
  bot: BotOptions;
  now?: () => number;
}

export function createApp({ publicKey, bot, now = Date.now }: AppOptions) {
  const app = new Hono();

  app.post("/interactions", async (c) => {
    // The raw text, exactly as signed. Parse it only once it's proven to be from Discord.
    const body = await c.req.text();
    const genuine = verifyDiscordRequest({
      body,
      signature: c.req.header("X-Signature-Ed25519"),
      timestamp: c.req.header("X-Signature-Timestamp"),
      publicKey,
      now: now(),
    });
    if (!genuine) return c.text("Bad request signature", 401);
    let interaction: Interaction;
    try {
      interaction = JSON.parse(body);
    } catch {
      return c.text("Not JSON", 400);
    }
    return c.json(await handleInteraction(interaction, bot));
  });

  app.get("/health", (c) => c.json({ status: "ok" }));
  return app;
}
