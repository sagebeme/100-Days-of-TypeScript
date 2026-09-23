# Day 10: Save Up for a PS5

Watch the video: *(not recorded yet)*

## The brief

A PS5 costs around 60,000 KES. You save a fixed amount every week. How many months until you can afford it? Build this from three small functions, each doing one job, then have the last one call the other two.

```
weeklyToMonthly(500)                    →  2000
monthsToAfford(60000, 2000)             →  30
monthsToAffordFromWeekly(60000, 500)    →  30
```

## What you'll use

- **Composing functions**: writing `monthsToAffordFromWeekly` in terms of the two functions you already wrote, instead of repeating their logic
- `Math.ceil`, to round *up* — if you're one shilling short in month 29, you still need a 30th month

## Steps

1. Open `starter/save-for-ps5.ts`.
2. `weeklyToMonthly`: return `weeklySavings * 4` (a simplification — we're treating every month as 4 weeks).
3. `monthsToAfford`: return `Math.ceil(price / monthlySavings)`.
4. `monthsToAffordFromWeekly`: call `weeklyToMonthly`, then pass its result into `monthsToAfford`, and return that.

```bash
npm test -- day-010
```

## When you're stuck

- **`monthsToAffordFromWeekly` duplicates the formulas instead of calling the other two functions** — that works, but it's not what this lesson is about. Delete the duplicated maths and call `weeklyToMonthly` and `monthsToAfford` instead. If you fix a bug in one of them later, the composed function should fix itself automatically.
- **Answer is one month short** — `Math.ceil`, not `Math.round` or a plain division. You can't afford it with a fraction of a month left to save.
- **Still stuck?** Read `solution/save-for-ps5.ts`, then close it and write your own from memory.
