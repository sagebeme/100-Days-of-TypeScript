import type { EvalCase } from "./cases.ts";
import type { Answer, Grader, Verdict } from "./graders.ts";

export interface CaseResult {
  id: string;
  answer: Answer | null;
  verdicts: Verdict[];
  pass: boolean; // every verdict passed (and there was an answer)
  error?: string; // the system crashed on this case
  ms: number;
}

export interface EvalRun {
  label: string;
  results: CaseResult[];
  passed: number;
  total: number;
  passRate: number; // 0 to 1
}

// Runs every case through the system, a few at a time (APIs have rate limits), and grades each
// answer with every grader that applies. One case crashing is a result, not the end of the run.
// TODO: run every case through the system, at most `concurrency` (default 4) at a time: start that many
// workers, each taking the next case until none are left. Keep results in the cases' order.
// For each case: answer = await system(question); verdicts = every grader's non-null verdict;
// pass = every verdict passed; ms = how long it took (options.now, default performance.now()).
// If the system throws: { answer: null, verdicts: [], pass: false, error: the message }, and carry on.
// Then passed, total and passRate (0 when there are no cases).
export async function runEval(
  label: string,
  system: (question: string) => Promise<Answer>,
  cases: EvalCase[],
  graders: Grader[],
  options: { concurrency?: number; now?: () => number } = {},
): Promise<EvalRun> {
  void [system, cases, graders, options];
  const results: CaseResult[] = [];
  const verdicts: Verdict[] = [];
  void verdicts;
  return { label, results, passed: 0, total: 0, passRate: 0 };
}

export interface Comparison {
  regressions: string[]; // passed before, fail now: the ones to look at first
  fixes: string[];
  stillFailing: string[];
  change: number; // in pass rate, -1 to 1
}

// Did the change help? A higher pass rate can still hide a new failure, so list them case by case.
// TODO: case by case, by id: regressions passed before and fail now; fixes the other way round;
// stillFailing failed both times. change is after.passRate - before.passRate.
export function compareRuns(before: EvalRun, after: EvalRun): Comparison {
  void [before, after];
  return { regressions: [], fixes: [], stillFailing: [], change: 0 };
}

// A report a person can read in ten seconds: the score, then only what failed, and why.
// TODO: "prompt v2: 1/3 passed (33%)", then one line per failed case:
//   "  ✗ wrong: includes: Missing: yes; sources: Didn't cite x#1"   (its failing verdicts, joined with "; ")
//   "  ✗ boom: crashed: timeout"
export function formatReport(run: EvalRun): string {
  return `${run.label}: TODO`;
}
