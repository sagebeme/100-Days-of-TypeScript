import Anthropic from "@anthropic-ai/sdk";
import { understand, type Understanding } from "./understand.ts";
import { PHRASES, REPLY_STYLE, type Language } from "./languages.ts";
// Everything from earlier days, used as it is.
import { HELP_CENTRE } from "../../day-078-embeddings-and-retrieval/starter/help-centre.ts";
import { chunkAll } from "../../day-078-embeddings-and-retrieval/starter/chunks.ts";
import type { Embedder } from "../../day-078-embeddings-and-retrieval/starter/embedders.ts";
import { buildIndex, search, type Index } from "../../day-078-embeddings-and-retrieval/starter/retrieval.ts";
import { makeTools, type ToolContext } from "../../day-077-agent-with-tools/starter/tools.ts";
import type { Store } from "../../day-077-agent-with-tools/starter/store.ts";

export interface ConciergeReply {
  text: string;
  language: Language;
  route: Understanding["route"];
  sources: string[];
  toolCalls: { name: string; input: unknown }[];
}

const FALLBACKS = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

const HELP_SYSTEM = `You answer questions from fans of Tikiti, a ticketing site in Nairobi, using only the help centre extracts you're given (they're in English).
Cite the extract each fact comes from with its id in square brackets, like [refunds#2].
If the extracts don't answer the question, say you're not sure and suggest emailing help@tikiti.example. Keep it to a few sentences.`;

const TICKETS_SYSTEM = `You are the Tikiti concierge, and you can look up events and buy tickets for fans in Nairobi.
Use your tools rather than guessing. Buying spends the fan's money: before you buy, tell them exactly what they're getting (the event, how many tickets, the total in KES) and wait for them to say yes. You'll need their M-Pesa number. After buying, tell them to enter their M-Pesa PIN within 10 minutes. Keep replies short.`;

export class Concierge {
  readonly #client: Anthropic;
  readonly #index: Index;
  readonly #context: ToolContext;
  readonly #tools: ReturnType<typeof makeTools>;
  #ticketHistory: Anthropic.Beta.BetaMessageParam[] = [];

  private constructor(client: Anthropic, index: Index, store: Store, now: () => Date) {
    this.#client = client;
    this.#index = index;
    this.#context = { turn: 0, now };
    this.#tools = makeTools(store, this.#context);
  }

  static async create(client: Anthropic, embedder: Embedder, store: Store, now: () => Date = () => new Date()): Promise<Concierge> {
    return new Concierge(client, await buildIndex(embedder, chunkAll(HELP_CENTRE)), store, now);
  }

  async send(message: string): Promise<ConciergeReply> {
    this.#context.turn += 1;
    const u = await understand(this.#client, message);
    // A ticket conversation that's under way stays one, whatever this message looks like on its own:
    // "ndio, 0712 345 678" only makes sense as the answer to "shall I buy them?".
    const route = this.#ticketHistory.length > 0 && u.route !== "help" ? "tickets" : u.route;
    const base = { language: u.language, route, sources: [] as string[], toolCalls: [] as ConciergeReply["toolCalls"] };
    if (route === "other") return { ...base, text: PHRASES.offTopic[u.language] };
    if (route === "help") return { ...base, ...(await this.#help(message, u)) };
    return { ...base, ...(await this.#tickets(message, u.language)) };
  }

  // Search with the English rewrite; answer the original, in their language.
  async #help(message: string, u: Understanding): Promise<Pick<ConciergeReply, "text" | "sources">> {
    const hits = await search(this.#index, u.searchQuery);
    if (hits.length === 0) return { text: PHRASES.noAnswer[u.language], sources: [] };
    const retrieved = hits.map((h) => h.chunk.id);
    const extracts = hits.map(({ chunk }) => `<extract id="${chunk.id}" title="${chunk.title}">\n${chunk.text}\n</extract>`).join("\n");
    const reply = await this.#client.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 16_000,
      system: `${HELP_SYSTEM}\n\n${REPLY_STYLE[u.language]}`,
      messages: [{ role: "user", content: `${extracts}\n\nQuestion: ${message}` }],
      output_config: { effort: "low" },
      ...FALLBACKS,
    });
    if (reply.stop_reason === "refusal") return { text: PHRASES.declined[u.language], sources: [] };
    const text = reply.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const cited = [...text.matchAll(/\[([a-z0-9-]+#\d+)\]/g)].map((m) => m[1]);
    return {
      text: text.replace(/\s*\[([a-z0-9-]+#\d+)\]/g, (whole, id: string) => (retrieved.includes(id) ? whole : "")),
      sources: [...new Set(cited.filter((id) => retrieved.includes(id)))],
    };
  }

  // Day 77's tools and guardrail, speaking their language.
  async #tickets(message: string, language: Language): Promise<Pick<ConciergeReply, "text" | "toolCalls">> {
    const runner = this.#client.beta.messages.toolRunner({
      model: "claude-opus-5",
      max_tokens: 16_000,
      system: `${TICKETS_SYSTEM}\n\n${REPLY_STYLE[language]}`,
      tools: Object.values(this.#tools),
      messages: [...this.#ticketHistory, { role: "user", content: message }],
      max_iterations: 8,
      ...FALLBACKS,
    });
    const toolCalls: ConciergeReply["toolCalls"] = [];
    let last: Anthropic.Beta.BetaMessage | undefined;
    for await (const reply of runner) {
      last = reply;
      if (reply.stop_reason === "refusal") break;
      for (const block of reply.content) if (block.type === "tool_use") toolCalls.push({ name: block.name, input: block.input });
    }
    if (!last || last.stop_reason === "refusal") return { text: PHRASES.declined[language], toolCalls };
    this.#ticketHistory = [...runner.params.messages];
    if (last.stop_reason === "tool_use") return { text: PHRASES.noAnswer[language], toolCalls };
    return { text: last.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join(""), toolCalls };
  }
}
