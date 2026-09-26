// Already written: paste an announcement, get a draft. Needs an API key (see Day 75).
//   node phase-7-ai/day-076-structured-output/starter/extract.ts < announcement.txt
import Anthropic from "@anthropic-ai/sdk";
import { text } from "node:stream/consumers";
import { extractEvent, checkDraft } from "./event-draft.ts";

const now = new Date();
const result = await extractEvent(new Anthropic(), await text(process.stdin), now);
if (!result.ok) {
  console.log(`Couldn't make a draft (${result.reason}):\n${result.problems.map((p) => `  - ${p}`).join("\n")}`);
} else {
  console.log(JSON.stringify(result.draft, null, 2));
  const problems = [...new Set([...checkDraft(result.draft, now), ...result.draft.missing])];
  if (problems.length > 0) console.log(`\nBefore publishing:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
}
