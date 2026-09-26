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
export async function runEval(
  label: string,
  system: (question: string) => Promise<Answer>,
  cases: EvalCase[],
  graders: Grader[],
  options: { concurrency?: number; now?: () => number } = {},
): Promise<EvalRun> {
  const concurrency = options.concurrency ?? 4;
  const now = options.now ?? (() => performance.now());
  const results: CaseResult[] = new Array(cases.length);
  let next = 0;

  async function worker() {
    while (next < cases.length) {
      const i = next++;
      const testCase = cases[i];
      const started = now();
      try {
        const answer = await system(testCase.question);
        const verdicts = (await Promise.all(graders.map((grade) => grade(testCase, answer)))).filter((v): v is Verdict => v !== null);
        results[i] = { id: testCase.id, answer, verdicts, pass: verdicts.every((v) => v.pass), ms: now() - started };
      } catch (error) {
        results[i] = { id: testCase.id, answer: null, verdicts: [], pass: false, error: error instanceof Error ? error.message : String(error), ms: now() - started };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, cases.length) }, worker));
  const passed = results.filter((r) => r.pass).length;
  return { label, results, passed, total: results.length, passRate: results.length ? passed / results.length : 0 };
}

export interface Comparison {
  regressions: string[]; // passed before, fail now: the ones to look at first
  fixes: string[];
  stillFailing: string[];
  change: number; // in pass rate, -1 to 1
}

// Did the change help? A higher pass rate can still hide a new failure, so list them case by case.
export function compareRuns(before: EvalRun, after: EvalRun): Comparison {
  const was = new Map(before.results.map((r) => [r.id, r.pass]));
  const regressions: string[] = [];
  const fixes: string[] = [];
  const stillFailing: string[] = [];
  for (const r of after.results) {
    const previously = was.get(r.id);
    if (previously === true && !r.pass) regressions.push(r.id);
    else if (previously === false && r.pass) fixes.push(r.id);
    else if (previously === false && !r.pass) stillFailing.push(r.id);
  }
  return { regressions, fixes, stillFailing, change: after.passRate - before.passRate };
}

// A report a person can read in ten seconds: the score, then only what failed, and why.
export function formatReport(run: EvalRun): string {
  const lines = [`${run.label}: ${run.passed}/${run.total} passed (${Math.round(run.passRate * 100)}%)`];
  for (const r of run.results.filter((r) => !r.pass)) {
    const why = r.error ? `crashed: ${r.error}` : r.verdicts.filter((v) => !v.pass).map((v) => `${v.grader}: ${v.reason}`).join("; ");
    lines.push(`  ✗ ${r.id}: ${why}`);
  }
  return lines.join("\n");
}
