import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { EvalCase } from "./cases.ts";

// What the system being tested gives back for one question.
export interface Answer {
  text: string;
  sources: string[];
}

export interface Verdict {
  grader: string;
  pass: boolean;
  reason: string;
}

export type Grader = (testCase: EvalCase, answer: Answer) => Promise<Verdict | null>; // null: doesn't apply to this case

// --- Code graders: exact, instant, free. Use these for everything they can check. ---
// Each returns null when the case doesn't ask for that check.

// TODO: every mustInclude fact is in the text (ignore capitalisation).
//   { grader: "includes", pass, reason: "Has every fact" or "Missing: fact one, fact two" }
export const includesFacts: Grader = async () => null;

// TODO: no mustNotInclude claim is in the text.
//   { grader: "avoids", pass, reason: "Said nothing it shouldn't" or "Said: claim one" }
export const avoidsClaims: Grader = async () => null;

// TODO: every expected source is among the answer's sources.
//   { grader: "sources", pass, reason: "Cited the right pieces" or "Didn't cite refunds#2" }
export const citesSources: Grader = async () => null;

// TODO: for outOfScope cases: it admits it doesn't know (the text matches
// /not sure|couldn't find|can't find|don't know|help@tikiti\.example/i) AND cites nothing.
//   { grader: "admits", pass, reason: "Said it doesn't know" / "Admitted it, but still cited sources" / "Answered something it can't know" }
export const admitsUnknown: Grader = async () => null;

// --- A model grader: for what code can't check, like tone. Slower, costs money, and can be wrong,
// so it gets a narrow question and must answer in a fixed shape, with its reason first. ---

export const JudgeVerdict = z.object({
  reasoning: z.string().describe("Two or three sentences on how the answer does against the rubric"),
  pass: z.boolean(),
});

const JUDGE_SYSTEM = `You grade answers from a customer support assistant for Tikiti, a ticketing site in Nairobi.
You're given the question, the answer and a rubric. Decide whether the answer meets the rubric. Judge only against the rubric: not length, not style you'd prefer. Think it through in "reasoning" before deciding "pass".`;

// TODO: a grader that asks a model, for cases with a rubric (null otherwise).
// claude-opus-5, max_tokens 16_000, system: JUDGE_SYSTEM, one message:
//   `<question>${question}</question>\n<answer>${answer text}</answer>\n<rubric>${rubric}</rubric>`
// output_config: { format: betaZodOutputFormat(JudgeVerdict), effort: "low" }, and Day 75's fallbacks.
// Check the reply with JudgeVerdict.safeParse. No usable verdict is a FAIL ("The judge didn't give a
// usable verdict"), never a pass. Otherwise { grader: "judge", pass, reason: its reasoning }.
export function llmJudge(client: Anthropic): Grader {
  void [client, JUDGE_SYSTEM, betaZodOutputFormat];
  return async () => null;
}
