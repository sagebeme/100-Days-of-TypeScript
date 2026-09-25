import { z } from "zod";
import type { Fetcher } from "./sources.ts";

export interface Messenger {
  send(text: string): Promise<void>;
}

export const TELEGRAM_LIMIT = 4096; // characters per message

const ReplySchema = z.object({ ok: z.boolean(), description: z.string().optional() });

export function fitToLimit(text: string, limit = TELEGRAM_LIMIT): string {
  // TODO: short enough -> unchanged; too long -> the first (limit - 1) characters and "…"
  throw new Error("not implemented yet");
}

// Telegram puts the bot token in the URL itself, so this URL must never be logged or shown in an error.
export function telegramMessenger(token: string, chatId: string, fetchFn: Fetcher): Messenger {
  // TODO: send(text): POST https://api.telegram.org/bot<token>/sendMessage with JSON
  //   { chat_id, text: fitToLimit(text), link_preview_options: { is_disabled: true } }
  // TODO: Telegram replies { ok: true } or { ok: false, description }. If the status isn't ok or ok is false,
  //   throw "Telegram didn't accept the message: <description>" (or "status <n>" if there's no description).
  //   Never put the URL in the error.
  throw new Error("not implemented yet");
}

export function consoleMessenger(log: (text: string) => void = console.log): Messenger {
  return {
    async send(text) {
      log(text);
    },
  };
}
