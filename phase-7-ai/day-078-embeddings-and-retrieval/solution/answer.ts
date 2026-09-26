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

// Retrieval-augmented generation: find the relevant extracts, give only those to the model, and ask
// it to answer from them, saying which ones it used.
export async function answerQuestion(client: Anthropic, index: Index, question: string): Promise<SourcedAnswer> {
  const hits = await search(index, question);
  if (hits.length === 0) return { text: NO_SOURCES, sources: [], retrieved: [] }; // nothing to answer from: don't even ask

  const extracts = hits.map(({ chunk }) => `<extract id="${chunk.id}" title="${chunk.title}">\n${chunk.text}\n</extract>`).join("\n");
  const message = await client.beta.messages.create({
    model: "claude-opus-5",
    max_tokens: 16_000,
    system: SYSTEM,
    messages: [{ role: "user", content: `${extracts}\n\nQuestion: ${question}` }],
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });
  const retrieved = hits.map(({ chunk }) => chunk.id);
  if (message.stop_reason === "refusal") return { text: NO_SOURCES, sources: [], retrieved };

  const text = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  // Trust, but check: only count citations of extracts that were actually given. A cited id that
  // wasn't retrieved was made up, and is taken out of the answer.
  const cited = [...text.matchAll(/\[([a-z0-9-]+#\d+)\]/g)].map((m) => m[1]);
  const sources = [...new Set(cited.filter((id) => retrieved.includes(id)))];
  const cleaned = text.replace(/\s*\[([a-z0-9-]+#\d+)\]/g, (whole, id: string) => (retrieved.includes(id) ? whole : ""));
  return { text: cleaned, sources, retrieved };
}
