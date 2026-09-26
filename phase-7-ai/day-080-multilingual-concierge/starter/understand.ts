import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { LANGUAGES, LANGUAGE_GUIDE, type Language } from "./languages.ts";

// Before answering, work out three things about a message, in one quick call with a fixed shape.
export const Understanding = z.object({
  language: z.enum(LANGUAGES),
  route: z
    .enum(["help", "tickets", "other"])
    .describe("help: a question the help centre answers (paying, refunds, the gate, accounts). tickets: finding events, prices, seats or buying. other: anything else"),
  searchQuery: z.string().describe("What they're asking, rewritten as a short plain-English question, for searching the (English) help centre"),
});
export type Understanding = z.infer<typeof Understanding>;

const SYSTEM = `You read messages sent to Tikiti's concierge (a ticketing site in Nairobi) and say what language they're in, what they want, and what they're asking in plain English.

${LANGUAGE_GUIDE}`;

// TODO: one quick call that returns an Understanding.
// The search runs on an English help centre: "Doh yangu itarudi kama event imecancelliwa?" shares no
// words with it; "Will I get my money back if the event is cancelled?" does. So the question comes back
// rewritten in English (searchQuery), while the reply will still go back in Sheng.
// - claude-opus-5, max_tokens 16_000, system: SYSTEM, the message as the only user message,
//   output_config: { format: betaZodOutputFormat(Understanding), effort: "low" }, Day 75's fallbacks
// - a refusal: { language: "english", route: "other", searchQuery: message }
// - a reply that isn't valid JSON, or doesn't pass Understanding.safeParse:
//   { language: "english", route: "help", searchQuery: message }: an honest answer is still possible
export async function understand(client: Anthropic, message: string): Promise<Understanding> {
  void [client, SYSTEM, betaZodOutputFormat];
  return { language: "english", route: "help", searchQuery: message };
}

export type { Language };
