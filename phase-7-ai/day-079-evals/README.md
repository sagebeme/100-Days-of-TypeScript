# Day 79: Evals — Knowing Whether a Change Made It Better

Watch the video: *(not recorded yet)*

## The brief

You've tweaked the concierge's prompt. Is it better? You try three questions; they look fine; you ship. Next morning, fans are told they can get refunds for events they just can't make.

An AI system's answers change every time you touch the prompt, the retrieval, the model or the settings, and a change that fixes one thing quietly breaks another. Today you build the tool that catches that: an **eval**. It's a set of real questions, each with checks its answer must pass, run in one go, with a score and a list of what failed:

```
help-centre concierge: 10/12 passed (83%)
  ✗ refund-cant-go: judge: The answer implies a refund is possible, instead of saying tickets can't be refunded.
  ✗ weather: admits: Answered something it can't know
```

## What's in it

- **Cases** (`cases.ts`, given). Twelve questions about the Day 78 help centre, each with what a good answer must contain, must never say, must cite, or must admit it doesn't know. The best cases come from real questions, especially the ones it got wrong.
- **Code graders.** Is the fact there? Did it avoid the false claim? Did it cite the right page? Did it admit what it can't know? They're exact, instant and free, so use them for everything they can check.
- **A model grader** (an "LLM judge") for what code can't check, such as "stays calm with an angry fan". It gets a narrow rubric and must answer in a fixed shape, with its reasoning *before* its verdict. A judge that fails to give a verdict counts as a **fail**, never a silent pass.
- **A runner.** It runs every case a few at a time (APIs have rate limits), keeps going when one case crashes, and times each one.
- **A comparison.** A score going from 75% to 83% can hide a case that used to pass and now fails. The comparison lists regressions first: those are what you look at before shipping.

## Steps

1. Read `cases.ts`.
2. `graders.ts`: the four code graders, then `llmJudge`. `npm test -- day-079 -t graders`.
3. `runner.ts`: `runEval`, `compareRuns`, `formatReport`.
4. Run the tests. Then, with an API key, run the eval on Day 78's concierge for real. Change its prompt, run it again, and compare:

   ```bash
   npm test -- day-079
   node phase-7-ai/day-079-evals/starter/run-evals.ts
   ```

## Rules for evals you can trust

- **Code first, a model only for what code can't judge.** Every model grader adds cost, time and its own mistakes.
- **One failing case is a story; read it.** The score tells you *whether* to look; the failures tell you *what* to fix.
- **Keep the cases that caught bugs.** Every bug a fan finds becomes a case, so it can't come back quietly.
- **Watch the cost.** An eval you're afraid to run because it's expensive won't get run.

## Check yourself

1. Before a change, cases a, b and c score pass, fail, pass. After it, they score fail, pass, pass. The pass rate hasn't moved. Predict `compareRuns(before, after)`, and say which list you read first.
2. The system throws on one case. What does `runEval` do, and what does `formatReport` print for it?
3. Why is the LLM judge told to give its `reasoning` before its `pass`, and why does a reply it can't parse count as a fail?
4. A case has no checks that apply to it. Does it pass? Why?

<details><summary>Answers</summary>

1. `{ regressions: ["a"], fixes: ["b"], stillFailing: [], change: 0 }`. Regressions come first: an unchanged score hid a case that used to pass.
2. It records that case as a failure with the error and carries on with the rest. The report line is `✗ d: crashed: boom` (with that case's id and error).
3. A verdict written first can only be explained afterwards; written last, it follows from the reasoning. And a judge that can't decide mustn't let a bad answer through silently.
4. Yes. `[].every(...)` is `true`, so a case where nothing applied passes, as long as the system gave an answer.

</details>

## When you're stuck

- **Results come out in the wrong order** — workers finish in any order. Write each result into its case's slot.
- **More than 3 run at once** — start `concurrency` workers that each take the *next* case in a loop, rather than starting every case at once.
- **A case with no checks fails** — `[].every(...)` is `true`: a case where nothing applied passes.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
