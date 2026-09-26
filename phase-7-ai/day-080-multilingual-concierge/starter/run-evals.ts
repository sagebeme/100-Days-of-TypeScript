// Already written: the whole concierge, evaluated in all three languages with Day 79's runner. Needs
// ANTHROPIC_API_KEY (and uses VOYAGE_API_KEY for retrieval if it's set). A run costs a few shillings.
//   node phase-7-ai/day-080-multilingual-concierge/starter/run-evals.ts
import Anthropic from "@anthropic-ai/sdk";
import { Concierge } from "./concierge.ts";
import { MULTILINGUAL_CASES } from "./cases.ts";
import { repliesInLanguage } from "./evals.ts";
import { hashingEmbedder, voyageEmbedder } from "../../day-078-embeddings-and-retrieval/starter/embedders.ts";
import { createStore } from "../../day-077-agent-with-tools/starter/store.ts";
import { includesFacts, citesSources, admitsUnknown, llmJudge } from "../../day-079-evals/starter/graders.ts";
import { runEval, formatReport } from "../../day-079-evals/starter/runner.ts";

const client = new Anthropic();
const embedder = process.env.VOYAGE_API_KEY ? voyageEmbedder({ apiKey: process.env.VOYAGE_API_KEY }) : hashingEmbedder();
// A fresh concierge per question: each case is its own conversation.
const run = await runEval(
  "multilingual concierge",
  async (question) => (await Concierge.create(client, embedder, createStore())).send(question),
  MULTILINGUAL_CASES,
  [includesFacts, citesSources, admitsUnknown, llmJudge(client), repliesInLanguage(client)],
  { concurrency: 2 },
);
console.log(formatReport(run));
