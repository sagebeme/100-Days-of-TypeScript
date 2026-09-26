import Anthropic from "@anthropic-ai/sdk";
import { search, type Index } from "./retrieval.ts";

export const NO_SOURCES = "I couldn't find that in the help centre. You can email help@tikiti.example, and someone will answer within an hour on event nights.";

export interface SourcedAnswer {
  text: string;
  sources: string[]; // the chunk ids the answer really used, e.g. ["refunds#2"]
  retrieved: string[]; // everything that was found and shown to the model
}

const SYSTEM = `You answer questions from fans of Tikiti, a ticketing site in Nairobi, using only the help centre extracts you're given.
Cite the extract each fact comes from with its id in square brackets, like [refunds#2].
If the extracts don't answer the question, say you're not sure and suggest emailing help@tikiti.example. Don't answer from general knowledge.
Keep it to a few friendly sentences.`;

// TODO: retrieval-augmented generation.
// 1. hits = await search(index, question). None: return { text: NO_SOURCES, sources: [], retrieved: [] }
//    without calling the model at all.
// 2. Put each hit in the message as <extract id="refunds#2" title="Refunds">\n{text}\n</extract>, one per line,
//    then a blank line and `Question: ${question}`.
// 3. Ask claude-opus-5 (max_tokens 16_000, system: SYSTEM, effort "low", Day 75's fallbacks).
//    A refusal: NO_SOURCES, no sources, and the retrieved ids.
// 4. Trust, but check: find every [page#n] citation in the text. sources are the ones that were retrieved
//    (each once). A citation of something that wasn't retrieved was made up: remove it from the text,
//    with the space before it.
export async function answerQuestion(client: Anthropic, index: Index, question: string): Promise<SourcedAnswer> {
  void [client, index, question, search, SYSTEM];
  throw new Error("TODO: answerQuestion");
}
