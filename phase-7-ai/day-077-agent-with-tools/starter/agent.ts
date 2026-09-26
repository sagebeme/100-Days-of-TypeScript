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

// TODO: an agent. The model decides which tools to call; the SDK's tool runner calls them and hands
// the results back, round and round, until the model has an answer.
// send(text):
// - context.turn goes up by one
// - client.beta.messages.toolRunner({ model: "claude-opus-5", max_tokens: 16_000, system: SYSTEM_PROMPT,
//   tools: Object.values(the tools), messages: [...history, the new user message], max_iterations: MAX_STEPS,
//   and Day 75's fallbacks })
// - for await (const message of runner): remember the last message; if its stop_reason is "refusal", stop
//   (the runner doesn't check stop reasons for you); collect every tool_use block as { name, input }
// - a refusal: { text: DECLINED, status: "declined" }, and the history stays as it was
// - otherwise the history becomes runner.params.messages: everything that happened, tools included
// - the last message still wants a tool (stop_reason "tool_use"): it ran out of steps: { text: STUCK, status: "stuck" }
// - otherwise: the last message's text, "answered"
export class TicketAgent {
  readonly #client: Anthropic;
  readonly #context: ToolContext;
  readonly #tools: ReturnType<typeof makeTools>;
  #history: Anthropic.Beta.BetaMessageParam[] = [];

  constructor(client: Anthropic, store: Store, now: () => Date = () => new Date()) {
    this.#client = client;
    this.#context = { turn: 0, now };
    this.#tools = makeTools(store, this.#context);
  }

  get history(): readonly Anthropic.Beta.BetaMessageParam[] {
    return this.#history;
  }

  async send(text: string): Promise<AgentReply> {
    void [this.#client, this.#tools, text, SYSTEM_PROMPT];
    throw new Error("TODO: TicketAgent.send");
  }
}
