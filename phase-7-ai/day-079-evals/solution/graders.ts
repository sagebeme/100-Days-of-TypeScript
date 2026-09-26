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

const lower = (s: string) => s.toLowerCase();

export const includesFacts: Grader = async (c, a) => {
  if (!c.mustInclude?.length) return null;
  const missing = c.mustInclude.filter((fact) => !lower(a.text).includes(lower(fact)));
  return { grader: "includes", pass: missing.length === 0, reason: missing.length ? `Missing: ${missing.join(", ")}` : "Has every fact" };
};

export const avoidsClaims: Grader = async (c, a) => {
  if (!c.mustNotInclude?.length) return null;
  const said = c.mustNotInclude.filter((claim) => lower(a.text).includes(lower(claim)));
  return { grader: "avoids", pass: said.length === 0, reason: said.length ? `Said: ${said.join(", ")}` : "Said nothing it shouldn't" };
};

export const citesSources: Grader = async (c, a) => {
  if (!c.sources?.length) return null;
  const missing = c.sources.filter((s) => !a.sources.includes(s));
  return { grader: "sources", pass: missing.length === 0, reason: missing.length ? `Didn't cite ${missing.join(", ")}` : "Cited the right pieces" };
};

// Out of scope: it should say it doesn't know (and point to support), and cite nothing.
export const admitsUnknown: Grader = async (c, a) => {
  if (!c.outOfScope) return null;
  const admits = /not sure|couldn't find|can't find|don't know|help@tikiti\.example/i.test(a.text);
  const pass = admits && a.sources.length === 0;
  return { grader: "admits", pass, reason: pass ? "Said it doesn't know" : admits ? "Admitted it, but still cited sources" : "Answered something it can't know" };
};

// --- A model grader: for what code can't check, like tone. Slower, costs money, and can be wrong,
// so it gets a narrow question and must answer in a fixed shape, with its reason first. ---

export const JudgeVerdict = z.object({
  reasoning: z.string().describe("Two or three sentences on how the answer does against the rubric"),
  pass: z.boolean(),
});

const JUDGE_SYSTEM = `You grade answers from a customer support assistant for Tikiti, a ticketing site in Nairobi.
You're given the question, the answer and a rubric. Decide whether the answer meets the rubric. Judge only against the rubric: not length, not style you'd prefer. Think it through in "reasoning" before deciding "pass".`;

export function llmJudge(client: Anthropic): Grader {
  return async (c, a) => {
    if (!c.rubric) return null;
    const message = await client.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 16_000,
      system: JUDGE_SYSTEM,
      messages: [{ role: "user", content: `<question>${c.question}</question>\n<answer>${a.text}</answer>\n<rubric>${c.rubric}</rubric>` }],
      output_config: { format: betaZodOutputFormat(JudgeVerdict), effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });
    const text = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const parsed = JudgeVerdict.safeParse((() => {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    })());
    // A judge that can't give a verdict is a failed check, never a silent pass.
    if (!parsed.success) return { grader: "judge", pass: false, reason: "The judge didn't give a usable verdict" };
    return { grader: "judge", pass: parsed.data.pass, reason: parsed.data.reasoning };
  };
}
