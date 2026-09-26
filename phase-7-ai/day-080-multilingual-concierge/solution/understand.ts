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

// The search runs on an English help centre. "Doh yangu itarudi kama event imecancelliwa?" shares no
// words with it; "Will I get my money back if the event is cancelled?" does. So the question is
// rewritten in English here, and that's what gets searched, while the reply still goes back in Sheng.
export async function understand(client: Anthropic, message: string): Promise<Understanding> {
  const fallback: Understanding = { language: "english", route: "help", searchQuery: message };
  const reply = await client.beta.messages.create({
    model: "claude-opus-5",
    max_tokens: 16_000,
    system: SYSTEM,
    messages: [{ role: "user", content: message }],
    output_config: { format: betaZodOutputFormat(Understanding), effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });
  if (reply.stop_reason === "refusal") return { ...fallback, route: "other" };
  const text = reply.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  try {
    const parsed = Understanding.safeParse(JSON.parse(text));
    // Not sure what they meant: treat it as an English help question, which still gets an honest answer.
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

export type { Language };
