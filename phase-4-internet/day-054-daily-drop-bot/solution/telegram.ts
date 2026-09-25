import { z } from "zod";
import type { Fetcher } from "./sources.ts";

export interface Messenger {
  send(text: string): Promise<void>;
}

export const TELEGRAM_LIMIT = 4096; // characters per message

const ReplySchema = z.object({ ok: z.boolean(), description: z.string().optional() });

export function fitToLimit(text: string, limit = TELEGRAM_LIMIT): string {
  return text.length <= limit ? text : `${text.slice(0, limit - 1)}…`;
}

// Telegram puts the bot token in the URL itself, so this URL must never be logged or shown in an error.
export function telegramMessenger(token: string, chatId: string, fetchFn: Fetcher): Messenger {
  return {
    async send(text) {
      const response = await fetchFn(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: fitToLimit(text), link_preview_options: { is_disabled: true } }),
      });
      const reply = ReplySchema.safeParse(await response.json().catch(() => null));
      if (!response.ok || !reply.success || !reply.data.ok) {
        const why = reply.success && reply.data.description ? reply.data.description : `status ${response.status}`;
        throw new Error(`Telegram didn't accept the message: ${why}`);
      }
    },
  };
}

export function consoleMessenger(log: (text: string) => void = console.log): Messenger {
  return {
    async send(text) {
      log(text);
    },
  };
}
