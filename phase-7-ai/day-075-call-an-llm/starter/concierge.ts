import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./prompt.ts";

// The model. Opus 5 is the most capable model for everyday work.
export const MODEL = "claude-opus-5";

export type History = Anthropic.Beta.BetaMessageParam[];

// TODO: the request for a conversation so far:
// - model: MODEL, max_tokens: 16_000 (a cut-off answer costs a whole retry), system: SYSTEM_PROMPT, messages: history
// - output_config: { effort: "low" }: a chat reply doesn't need deep thinking; low is faster and cheaper
// - betas: ["server-side-fallback-2026-07-01"] and fallbacks: "default": if a safety classifier declines, the
//   API re-runs the request on the model Anthropic recommends for that kind of decline, in the same call
export function buildRequest(history: History): Anthropic.Beta.MessageCreateParamsNonStreaming {
  return { model: MODEL, max_tokens: 1024, messages: history };
}

export interface Answer {
  text: string;
  status: "answered" | "cut-short" | "declined";
  model: string; // who actually answered: a fallback model, if one stepped in
  usage: Anthropic.Beta.BetaUsage;
}

// TODO: only the text blocks' text, joined. A reply is a list of blocks, and not every block is text.
export function textOf(content: Anthropic.Beta.BetaContentBlock[]): string {
  void content;
  return "";
}

export const DECLINED = "Sorry, I can't help with that one. For anything about your tickets or an event, I'm here.";
export const CUT_SHORT = "(That answer was cut short. Ask me to carry on.)";

// TODO: one question, one answer. client.beta.messages.create(buildRequest(...)), then check stop_reason
// before trusting the content:
//   "refusal": { status: "declined", text: DECLINED }
//   "max_tokens": { status: "cut-short", text: the text, a newline, then CUT_SHORT }
//   otherwise: { status: "answered", text }
// and always model: message.model, usage: message.usage.
export async function ask(client: Anthropic, question: string): Promise<Answer> {
  void [client, question];
  throw new Error("TODO: ask");
}

// TODO: turn the SDK's typed errors into something a person can act on, most specific first
// (use instanceof, never the message text):
//   Anthropic.AuthenticationError: "The concierge isn't set up: set ANTHROPIC_API_KEY (or run `ant auth login`)."
//   Anthropic.RateLimitError:      "The concierge is very busy right now. Try again in a minute."
//   Anthropic.BadRequestError:     `The request was wrong, which is a bug on our side: ${error.message}`
//   Anthropic.APIConnectionError:  "Couldn't reach the concierge. Check your connection."
//   Anthropic.APIError, status 500 or more: "The concierge had a problem on its side. Try again."
//   anything else: "Something went wrong."
export function explainError(error: unknown): string {
  void error;
  return "Something went wrong.";
}

// TODO: a chat. The API remembers nothing between calls, so send the whole history every time.
// send(text, onText):
// - push the user's message, then stream: client.beta.messages.stream(buildRequest(history)),
//   stream.on("text", onText), and await stream.finalMessage()
// - push { role: "assistant", content: message.content }: every block, not just the text
// - a declined question: take it back out of the history, so the conversation can carry on
// - an error: take the question back out too, then rethrow
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
    void [this.#client, text, onText];
    throw new Error("TODO: Conversation.send");
  }
}

// What a reply cost, in shillings. Opus 5 is $5 per million input tokens and $25 per million output
// tokens; reading from the prompt cache costs a tenth, writing to it a quarter more.
export const PRICES_USD_PER_MILLION = { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 };

// TODO: add up input, output, cache reads and cache writes at those prices, convert to shillings, and
// round to the cent (two decimal places).
export function costKes(usage: Pick<Anthropic.Beta.BetaUsage, "input_tokens" | "output_tokens"> & Partial<Anthropic.Beta.BetaUsage>, kesPerUsd = 129): number {
  void [usage, kesPerUsd];
  return 0;
}
