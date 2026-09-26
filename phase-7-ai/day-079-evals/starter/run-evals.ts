// Already written: run the eval on Day 78's help-centre concierge, for real. Needs ANTHROPIC_API_KEY;
// with 12 cases and a judge on a few, one run costs a few shillings.
//   node phase-7-ai/day-079-evals/starter/run-evals.ts
import Anthropic from "@anthropic-ai/sdk";
import { CASES } from "./cases.ts";
import { includesFacts, avoidsClaims, citesSources, admitsUnknown, llmJudge } from "./graders.ts";
import { runEval, formatReport } from "./runner.ts";
import { HELP_CENTRE } from "../../day-078-embeddings-and-retrieval/starter/help-centre.ts";
import { chunkAll } from "../../day-078-embeddings-and-retrieval/starter/chunks.ts";
import { hashingEmbedder } from "../../day-078-embeddings-and-retrieval/starter/embedders.ts";
import { buildIndex } from "../../day-078-embeddings-and-retrieval/starter/retrieval.ts";
import { answerQuestion } from "../../day-078-embeddings-and-retrieval/starter/answer.ts";

const client = new Anthropic();
const index = await buildIndex(hashingEmbedder(), chunkAll(HELP_CENTRE));
const run = await runEval("help-centre concierge", (question) => answerQuestion(client, index, question), CASES, [
  includesFacts,
  avoidsClaims,
  citesSources,
  admitsUnknown,
  llmJudge(client),
]);
console.log(formatReport(run));
