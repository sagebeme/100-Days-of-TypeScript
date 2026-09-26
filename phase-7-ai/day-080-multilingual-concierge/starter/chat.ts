// Already written: talk to the whole concierge, in English, Kiswahili or Sheng. Needs ANTHROPIC_API_KEY.
//   node phase-7-ai/day-080-multilingual-concierge/starter/chat.ts
import Anthropic from "@anthropic-ai/sdk";
import { createInterface } from "node:readline/promises";
import { Concierge } from "./concierge.ts";
import { hashingEmbedder, voyageEmbedder } from "../../day-078-embeddings-and-retrieval/starter/embedders.ts";
import { createStore } from "../../day-077-agent-with-tools/starter/store.ts";

const embedder = process.env.VOYAGE_API_KEY ? voyageEmbedder({ apiKey: process.env.VOYAGE_API_KEY }) : hashingEmbedder();
const concierge = await Concierge.create(new Anthropic(), embedder, createStore());
const terminal = createInterface({ input: process.stdin, output: process.stdout });
console.log("Tikiti concierge. Niaje! Ask in English, Kiswahili or Sheng. Ctrl+D to leave.\n");
for await (const line of terminal) {
  if (!line.trim()) continue;
  const reply = await concierge.send(line);
  const extras = [reply.language, reply.route, ...reply.toolCalls.map((c) => `→ ${c.name}`)].join(" · ");
  console.log(`\n${reply.text}\n  (${extras})\n`);
}
