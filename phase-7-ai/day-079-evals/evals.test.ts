import { describe, it, expect } from "vitest";
import { fakeClaude, say } from "./starter/fake-claude.ts";
import { CASES, type EvalCase } from "./starter/cases.ts";
import { includesFacts, avoidsClaims, citesSources, admitsUnknown, llmJudge, type Answer } from "./starter/graders.ts";
import { runEval, compareRuns, formatReport } from "./starter/runner.ts";

const refund = CASES.find((c) => c.id === "refund-cancelled")!;
const weather = CASES.find((c) => c.id === "weather")!;
const rude = CASES.find((c) => c.id === "rude")!;
const answer = (text: string, sources: string[] = []): Answer => ({ text, sources });

describe("code graders", () => {
  it("check the facts are there, in any capitalisation", async () => {
    expect(await includesFacts(refund, answer("Refunds arrive within 3 Working Days."))).toEqual({ grader: "includes", pass: true, reason: "Has every fact" });
    expect(await includesFacts(refund, answer("You'll be refunded soon."))).toEqual({ grader: "includes", pass: false, reason: "Missing: 3 working days" });
    expect(await includesFacts(rude, answer("…"))).toBeNull(); // doesn't apply
  });

  it("check it didn't say what it mustn't", async () => {
    expect((await avoidsClaims(weather, answer("It will rain, bring an umbrella")))?.pass).toBe(false);
    expect((await avoidsClaims(weather, answer("I'm not sure about the weather.")))?.pass).toBe(true);
  });

  it("check it cited the right pieces", async () => {
    expect((await citesSources(refund, answer("…", ["refunds#2", "refunds#3"])))?.pass).toBe(true);
    expect(await citesSources(refund, answer("…", ["paying#1"]))).toEqual({ grader: "sources", pass: false, reason: "Didn't cite refunds#2" });
  });

  it("check it admits what it can't know, without citing anything", async () => {
    expect((await admitsUnknown(weather, answer("I'm not sure. You could email help@tikiti.example.")))?.pass).toBe(true);
    expect((await admitsUnknown(weather, answer("Sunny all day!")))?.pass).toBe(false);
    expect((await admitsUnknown(weather, answer("I'm not sure", ["gate#2"])))?.reason).toBe("Admitted it, but still cited sources");
    expect(await admitsUnknown(refund, answer("…"))).toBeNull();
  });
});

describe("the judge", () => {
  it("asks a narrow question and wants a verdict in a fixed shape, reasoning first", async () => {
    const { client, requests } = fakeClaude([say(JSON.stringify({ reasoning: "Calm, and points to refund rules.", pass: true }))]);
    const verdict = await llmJudge(client)(rude, answer("I'm sorry it's been frustrating. Tickets can only be refunded if the event is cancelled…"));
    expect(verdict).toEqual({ grader: "judge", pass: true, reason: "Calm, and points to refund rules." });
    const body = requests[0].body as Record<string, any>;
    expect(body.model).toBe("claude-opus-5");
    expect(Object.keys(body.output_config.format.schema.properties)).toEqual(["reasoning", "pass"]);
    const prompt = body.messages[0].content as string;
    expect(prompt).toContain(`<rubric>${rude.rubric}</rubric>`);
    expect(prompt).toContain("<answer>I'm sorry");
  });

  it("counts a judge that won't give a verdict as a failure, never a pass", async () => {
    const { client } = fakeClaude([say("Looks fine to me!")]);
    expect(await llmJudge(client)(rude, answer("…"))).toEqual({ grader: "judge", pass: false, reason: "The judge didn't give a usable verdict" });
  });

  it("isn't asked when a case has no rubric", async () => {
    const { client, requests } = fakeClaude([]);
    expect(await llmJudge(client)(refund, answer("…"))).toBeNull();
    expect(requests).toHaveLength(0);
  });
});

describe("running an eval", () => {
  const cases: EvalCase[] = [
    { id: "a", question: "qa", mustInclude: ["yes"] },
    { id: "b", question: "qb", mustInclude: ["yes"] },
    { id: "c", question: "qc", mustInclude: ["yes"] },
    { id: "d", question: "qd" },
  ];

  it("grades every case, keeps them in order, and scores the run", async () => {
    const run = await runEval("v1", async (q) => answer(q === "qb" ? "no" : "yes"), cases, [includesFacts]);
    expect(run.results.map((r) => [r.id, r.pass])).toEqual([["a", true], ["b", false], ["c", true], ["d", true]]);
    expect(run).toMatchObject({ label: "v1", passed: 3, total: 4, passRate: 0.75 });
    expect(run.results[1].verdicts).toEqual([{ grader: "includes", pass: false, reason: "Missing: yes" }]);
    expect(run.results[3].verdicts).toEqual([]); // nothing applied to d
  });

  it("runs a few at a time, never more", async () => {
    let running = 0;
    let most = 0;
    const system = async () => {
      most = Math.max(most, ++running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running--;
      return answer("yes");
    };
    const many = Array.from({ length: 12 }, (_, i) => ({ id: `c${i}`, question: "q" }));
    await runEval("load", system, many, [], { concurrency: 3 });
    expect(most).toBe(3);
  });

  it("records a crash as a failed case, and carries on", async () => {
    const run = await runEval("v1", async (q) => (q === "qc" ? Promise.reject(new Error("rate limited")) : answer("yes")), cases, [includesFacts]);
    expect(run.results[2]).toMatchObject({ id: "c", pass: false, answer: null, error: "rate limited" });
    expect(run.passed).toBe(3);
  });

  it("times each case", async () => {
    let clock = 0;
    const run = await runEval("v1", async () => ((clock += 250), answer("yes")), cases.slice(0, 1), [], { now: () => clock });
    expect(run.results[0].ms).toBe(250);
  });
});

describe("comparing and reporting", () => {
  it("shows what a change broke as well as what it fixed, even when the score went up", async () => {
    const cases: EvalCase[] = ["a", "b", "c", "d"].map((id) => ({ id, question: id, mustInclude: ["ok"] }));
    const before = await runEval("v1", async (q) => answer(["a", "b"].includes(q) ? "ok" : "no"), cases, [includesFacts]);
    const after = await runEval("v2", async (q) => answer(["b", "c", "d"].includes(q) ? "ok" : "no"), cases, [includesFacts]);
    expect(compareRuns(before, after)).toEqual({ regressions: ["a"], fixes: ["c", "d"], stillFailing: [], change: 0.25 });
  });

  it("reports the score, then only what failed and why", async () => {
    const cases: EvalCase[] = [
      { id: "ok", question: "ok", mustInclude: ["yes"] },
      { id: "wrong", question: "wrong", mustInclude: ["yes"], sources: ["x#1"] },
      { id: "boom", question: "boom" },
    ];
    const run = await runEval("prompt v2", async (q) => (q === "boom" ? Promise.reject(new Error("timeout")) : answer(q === "ok" ? "yes" : "no")), cases, [includesFacts, citesSources]);
    expect(formatReport(run)).toBe(["prompt v2: 1/3 passed (33%)", "  ✗ wrong: includes: Missing: yes; sources: Didn't cite x#1", "  ✗ boom: crashed: timeout"].join("\n"));
  });
});

describe("the cases", () => {
  it("each have an id, a question, and at least one check", () => {
    expect(new Set(CASES.map((c) => c.id)).size).toBe(CASES.length);
    for (const c of CASES) expect(Boolean(c.mustInclude || c.mustNotInclude || c.sources || c.outOfScope || c.rubric)).toBe(true);
  });
});
