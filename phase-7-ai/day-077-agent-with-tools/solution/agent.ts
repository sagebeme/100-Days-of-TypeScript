import Anthropic from "@anthropic-ai/sdk";
import { makeTools, type ToolContext } from "./tools.ts";
import { SYSTEM_PROMPT } from "./prompt.ts";
import type { Store } from "./store.ts";

// The most tool calls in one reply before the agent stops and says so, instead of looping forever
// (and spending money forever).
export const MAX_STEPS = 8;

export interface AgentReply {
  text: string;
  status: "answered" | "declined" | "stuck";
  toolCalls: { name: string; input: unknown }[];
}

export const STUCK = "Sorry, I got stuck working that out. Could you ask me in a different way?";
export const DECLINED = "Sorry, I can't help with that one.";

// An agent: the model decides which tools to call, the SDK's tool runner calls them and hands the
// results back, round and round, until the model has an answer.
export class TicketAgent {
  readonly #client: Anthropic;
  readonly #tools: ReturnType<typeof makeTools>[keyof ReturnType<typeof makeTools>][];
  readonly #context: ToolContext;
  #history: Anthropic.Beta.BetaMessageParam[] = [];

  constructor(client: Anthropic, store: Store, now: () => Date = () => new Date()) {
    this.#client = client;
    this.#context = { turn: 0, now };
    this.#tools = Object.values(makeTools(store, this.#context));
  }

  get history(): readonly Anthropic.Beta.BetaMessageParam[] {
    return this.#history;
  }

  async send(text: string): Promise<AgentReply> {
    this.#context.turn += 1;
    const runner = this.#client.beta.messages.toolRunner({
      model: "claude-opus-5",
      max_tokens: 16_000,
      system: SYSTEM_PROMPT,
      tools: this.#tools,
      messages: [...this.#history, { role: "user", content: text }],
      max_iterations: MAX_STEPS,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });

    const toolCalls: AgentReply["toolCalls"] = [];
    let last: Anthropic.Beta.BetaMessage | undefined;
    for await (const message of runner) {
      last = message;
      // The runner doesn't check stop reasons for you: check before it runs this turn's tools.
      if (message.stop_reason === "refusal") break;
      for (const block of message.content) if (block.type === "tool_use") toolCalls.push({ name: block.name, input: block.input });
    }

    if (!last || last.stop_reason === "refusal") return { text: DECLINED, status: "declined", toolCalls };
    // Everything that happened this turn, tool calls and results included, so the next turn remembers it.
    this.#history = [...runner.params.messages];
    if (last.stop_reason === "tool_use") return { text: STUCK, status: "stuck", toolCalls };
    const reply = last.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
    return { text: reply, status: "answered", toolCalls };
  }
}
