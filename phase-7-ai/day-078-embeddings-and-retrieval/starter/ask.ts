// Already written: ask the help centre a question. Retrieval runs on your computer with the hashing
// embedder, or with Voyage AI if VOYAGE_API_KEY is set; the answer needs ANTHROPIC_API_KEY (Day 75).
//   node phase-7-ai/day-078-embeddings-and-retrieval/starter/ask.ts "Will I get my money back if it's cancelled?"
//   node phase-7-ai/day-078-embeddings-and-retrieval/starter/ask.ts --search-only "doors open"   (no API calls at all)
import Anthropic from "@anthropic-ai/sdk";
import { HELP_CENTRE } from "./help-centre.ts";
import { chunkAll } from "./chunks.ts";
import { hashingEmbedder, voyageEmbedder } from "./embedders.ts";
import { buildIndex, search } from "./retrieval.ts";
import { answerQuestion } from "./answer.ts";

const args = process.argv.slice(2);
const searchOnly = args[0] === "--search-only";
const question = args.slice(searchOnly ? 1 : 0).join(" ");
const embedder = process.env.VOYAGE_API_KEY ? voyageEmbedder({ apiKey: process.env.VOYAGE_API_KEY }) : hashingEmbedder();
const index = await buildIndex(embedder, chunkAll(HELP_CENTRE));
console.log(`Searching ${index.chunks.length} pieces with ${embedder.name}\n`);

for (const hit of await search(index, question)) console.log(`  ${hit.score.toFixed(2)}  ${hit.chunk.id}  ${hit.chunk.text.slice(0, 70)}…`);
if (!searchOnly) {
  const answer = await answerQuestion(new Anthropic(), index, question);
  console.log(`\n${answer.text}\n\nSources: ${answer.sources.join(", ") || "none"}`);
}
