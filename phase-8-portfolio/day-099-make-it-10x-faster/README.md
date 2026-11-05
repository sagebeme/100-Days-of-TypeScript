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

## Check yourself

1. The orders double and the report takes four times as long. What does that tell you, and what kind of line do you look for?
2. Why profile before changing anything, and which view do you read first?
3. The profile points at `Intl.DateTimeFormat`. What's the fix, and why does it help so much?
4. Spot the bug in a faster version: the event rows are built by grouping the orders in a `Map`. Which event goes missing?

<details><summary>Answers</summary>

1. Something is n²: work that grows with the square of the input. Look for `find`, `filter` or `includes` inside a loop over another list, and build a `Map` or `Set` once instead.
2. The slow part is rarely where you'd guess, and guessing first is how a day's work makes it 10% faster. The bottom-up view, by *self* time.
3. Create one formatter, once, outside the function, and reuse it. A formatter is slow to create and quick to use, and the original made a new one for every order.
4. An event nobody bought has no orders, so it never gets a row. Build the rows from `season.events`, with `topBuyer: null` for an event with no orders.

</details>

## When you're stuck

- **You don't know where to start** — profile before you change anything (the command is at the top of `bench.ts`), and look at the bottom-up view's *self* time. Guessing first is how a day of work makes it 10% faster.
- **The profile points at `Intl`** — an `Intl.DateTimeFormat` is slow to create and quick to use. Make one, once, outside the function, and reuse it for every order.
- **A number or an ordering changed** — keep every sort's comparison exactly as it was; only move *where* a sort happens. A `Map` keeps insertion order, so sort its values when the order matters, the same way the original did.
- **An event nobody bought goes missing** — build the event rows from `season.events`, not from the orders, so every event gets a row (with `topBuyer: null`).
- **The month or the hour is wrong for late-night orders** — keep reading them in `Africa/Nairobi`. `getMonth()` and `getHours()` use the computer's time zone.
- **It's faster, but not 10x** — run the bench at its four sizes. If the time still grows faster than the orders, a `find`, `filter` or `includes` inside a loop is still there.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
