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

// TODO: the concierge, put together from the earlier days.
// create(): build a Day 78 index of the whole help centre with the embedder (chunkAll(HELP_CENTRE)).
// send(message):
// - context.turn goes up by one (Day 77's buy guardrail needs it)
// - understand(message)
// - the route: "tickets" if a ticket conversation is under way (there's ticket history) and this isn't a
//   help question ("ndio, 0712 345 678" only makes sense as an answer to "shall I buy them?"); otherwise u.route
// - "other": PHRASES.offTopic in their language, with no more calls
// - "help": search the index with u.searchQuery (the English rewrite!). Nothing found: PHRASES.noAnswer, no more
//   calls. Otherwise Day 78's extracts, but the system is HELP_SYSTEM + "\n\n" + REPLY_STYLE[language], and the
//   question at the end is the ORIGINAL message. Refusal: PHRASES.declined. Keep only citations of retrieved
//   extracts, in sources and in the text.
// - "tickets": Day 77's agent loop with makeTools (toolRunner, max_iterations 8), the system is TICKETS_SYSTEM +
//   "\n\n" + REPLY_STYLE[language], and the ticket history carries on across messages. Refusal: PHRASES.declined;
//   out of steps: PHRASES.noAnswer.
// Always reply { text, language, route, sources, toolCalls }.
export class Concierge {
  readonly #client: Anthropic;
  readonly #index: Index;
  readonly #context: ToolContext;
  readonly #tools: ReturnType<typeof makeTools>;

  private constructor(client: Anthropic, index: Index, store: Store, now: () => Date) {
    this.#client = client;
    this.#index = index;
    this.#context = { turn: 0, now };
    this.#tools = makeTools(store, this.#context);
  }

  static async create(client: Anthropic, embedder: Embedder, store: Store, now: () => Date = () => new Date()): Promise<Concierge> {
    void [HELP_CENTRE, chunkAll, buildIndex];
    return new Concierge(client, { embedder, chunks: [], vectors: [] }, store, now);
  }

  async send(message: string): Promise<ConciergeReply> {
    void [this.#client, this.#index, this.#tools, understand, search, PHRASES, REPLY_STYLE, FALLBACKS, HELP_SYSTEM, TICKETS_SYSTEM];
    throw new Error(`TODO: Concierge.send(${message})`);
  }
}
