# Day 99: Make It 10x Faster

*A brief and a test suite. No walkthrough.*

## The brief

Tikiti's end-of-season report works. Every number is right, and the code reads nicely. On a real season it takes over a second and a half, and more as the platform grows, so the organisers' dashboard times out. Make `report.ts` at least **10x faster** without changing a single number, name or ordering it produces.

`original-report.ts` is a frozen copy of the report as it is now. The tests compare yours with it on several made-up seasons, including the awkward ones: ties, an empty season, an event nobody bought, orders just after midnight in Nairobi. Then they time both.

## The method

Performance work without measuring is guessing, and the guess is usually wrong.

1. **Measure.** `node phase-8-portfolio/day-099-make-it-10x-faster/starter/bench.ts` times both versions at four sizes. Watch what happens to the time when the orders double. Twice the time is fine. Four times the time means something is n².
2. **Profile.** Run with `--cpu-prof` (the command is at the top of `bench.ts`), then open the `.cpuprofile` in Chrome DevTools (**Performance → Load profile**) or VS Code. Look at the **bottom-up** view: which functions have the most *self* time? The answer may surprise you.
3. **Fix the biggest thing, then measure again.** One change at a time, running the tests after each. Stop when you're comfortably past 10x. The code should still read well: fast code nobody can change isn't a win.

## What to look for

Real slow code is rarely one bad algorithm. It's reasonable-looking lines doing more work than they seem to:

- `list.find(...)` or `list.filter(...)` **inside a loop over another list**: that's n × m. Build a `Map` once.
- Objects that are **expensive to create** but cheap to use, created again on every iteration.
- **Sorting inside a loop**, when once at the end would do.
- `array.includes` on a growing array, where a `Set` would do.

## Done when

```bash
npm test -- day-099
```

The speed test prints both times. The ratio is measured in the same process, the best of several runs, so a busy laptop slows both versions alike.

## Stretch

- Write down, for each change, how much faster it made things. Which one mattered most? Were you right before you profiled?
- The report is now linear. Make it *incremental*: keep running totals as orders come in, so the dashboard never recomputes the season.
- Try it with a million orders. What's the slow part now? (Hint: memory.)
