import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./prompt.ts";

// The model, and how it's called. Opus 5 is the most capable model for everyday work; a chat reply
// doesn't need deep thinking, so effort is "low": faster answers, fewer tokens.
export const MODEL = "claude-opus-5";

// If a safety classifier declines a request, "fallbacks: default" re-runs it on the model Anthropic
// recommends for that kind of decline, inside the same call, instead of handing back a refusal.
const FALLBACKS = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

export type History = Anthropic.Beta.BetaMessageParam[];

export function buildRequest(history: History): Anthropic.Beta.MessageCreateParamsNonStreaming {
  return {
    model: MODEL,
    max_tokens: 16_000,
    system: SYSTEM_PROMPT,
    messages: history,
    output_config: { effort: "low" },
    ...FALLBACKS,
  };
}

export interface Answer {
  text: string;
  status: "answered" | "cut-short" | "declined";
  model: string; // who actually answered: a fallback model, if one stepped in
  usage: Anthropic.Beta.BetaUsage;
}

// Only the text: a reply is a list of blocks, and not every block is text.
export function textOf(content: Anthropic.Beta.BetaContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

export const DECLINED = "Sorry, I can't help with that one. For anything about your tickets or an event, I'm here.";
export const CUT_SHORT = "(That answer was cut short. Ask me to carry on.)";

// Always check why the model stopped before trusting what it said.
function toAnswer(message: Anthropic.Beta.BetaMessage): Answer {
  const base = { model: message.model, usage: message.usage };
  if (message.stop_reason === "refusal") return { ...base, text: DECLINED, status: "declined" };
  if (message.stop_reason === "max_tokens") return { ...base, text: `${textOf(message.content)}\n${CUT_SHORT}`, status: "cut-short" };
  return { ...base, text: textOf(message.content), status: "answered" };
}

// One question, one answer.
export async function ask(client: Anthropic, question: string): Promise<Answer> {
  const message = await client.beta.messages.create(buildRequest([{ role: "user", content: question }]));
  return toAnswer(message);
}

// Turn the SDK's typed errors into something a fan (or you) can act on. Most specific first.
export function explainError(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) return "The concierge isn't set up: set ANTHROPIC_API_KEY (or run `ant auth login`).";
  if (error instanceof Anthropic.RateLimitError) return "The concierge is very busy right now. Try again in a minute.";
  if (error instanceof Anthropic.BadRequestError) return `The request was wrong, which is a bug on our side: ${error.message}`;
  if (error instanceof Anthropic.APIConnectionError) return "Couldn't reach the concierge. Check your connection.";
  if (error instanceof Anthropic.APIError && (error.status ?? 0) >= 500) return "The concierge had a problem on its side. Try again.";
  return "Something went wrong.";
}

// A chat: the API remembers nothing between calls, so the whole conversation is sent every time.
// Replies stream in piece by piece, so the fan sees the answer being written instead of waiting.
export class Conversation {
  readonly #client: Anthropic;
  readonly #history: History = [];

  constructor(client: Anthropic) {
    this.#client = client;
  }

  get history(): readonly Anthropic.Beta.BetaMessageParam[] {
    return this.#history;
  }

  async send(text: string, onText: (piece: string) => void = () => {}): Promise<Answer> {
    this.#history.push({ role: "user", content: text });
    try {
      const stream = this.#client.beta.messages.stream(buildRequest(this.#history));
      stream.on("text", onText);
      const message = await stream.finalMessage();
      const answer = toAnswer(message);
      if (answer.status === "declined") {
        // Keep the conversation usable: the declined question comes out, as if it was never asked.
        this.#history.pop();
      } else {
        // The whole reply goes back into the history, every block, not just its text.
        this.#history.push({ role: "assistant", content: message.content });
      }
      return answer;
    } catch (error) {
      this.#history.pop(); // it wasn't answered, so it isn't part of the conversation
      throw error;
    }
  }
}

// What a reply cost, in shillings. Opus 5 is $5 per million input tokens and $25 per million output
// tokens; reading from the prompt cache costs a tenth, writing to it a quarter more.
export const PRICES_USD_PER_MILLION = { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 };

export function costKes(usage: Pick<Anthropic.Beta.BetaUsage, "input_tokens" | "output_tokens"> & Partial<Anthropic.Beta.BetaUsage>, kesPerUsd = 129): number {
  const usd =
    (usage.input_tokens * PRICES_USD_PER_MILLION.input +
      usage.output_tokens * PRICES_USD_PER_MILLION.output +
      (usage.cache_read_input_tokens ?? 0) * PRICES_USD_PER_MILLION.cacheRead +
      (usage.cache_creation_input_tokens ?? 0) * PRICES_USD_PER_MILLION.cacheWrite) /
    1_000_000;
  return Math.round(usd * kesPerUsd * 100) / 100; // to the cent
}
