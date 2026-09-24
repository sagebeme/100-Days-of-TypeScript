# Day 26: Screen Time Report — map, filter and reduce

Watch the video: *(not recorded yet)*

## The brief

Your phone gives you a weekly screen time report. You'll build the calculations behind one: total time, time per category, your top apps, which sessions were long, and how to print minutes as `2h 05m`. Every one of these is a transformation of a list, and there are three tools that cover almost all of them.

```
totalMinutes(sessions)           →  435
minutesByCategory(sessions)      →  { social: 270, games: 60, study: 80, video: 25 }
topApps(sessions, 2)             →  [ { app: "Instagram", minutes: 140 }, { app: "TikTok", minutes: 130 } ]
formatMinutes(125)               →  "2h 05m"
```

## What you'll use

| Tool | Question it answers | Shape |
| --- | --- | --- |
| `map` | "Turn each item into something else" | list in, list out, same length |
| `filter` | "Keep only the items that pass a test" | list in, shorter list out |
| `reduce` | "Boil the whole list down to one value" | list in, one value out |

You'll also chain them: `sessions.filter(...).map(...)`. And you'll type a `Record<Category, number>`, an object with exactly one number for each category.

## Steps

1. Open `starter/screen-time.ts`. `Session`, `Category` and `CategoryTotals` are written.
2. `totalMinutes(sessions)`: use `reduce` to add up `minutes`. `sessions.reduce((sum, s) => sum + s.minutes, 0)`.
3. `longSessionApps(sessions, threshold)`: the app names of sessions of at least `threshold` minutes, in the order they appear. That's `filter` then `map`.
4. `minutesByCategory(sessions)`: use `reduce` again, with a starting object that has all four categories set to `0` so every category always appears, even with no sessions.
5. `topApps(sessions, count)`: add up minutes per app (a `Map`, or `reduce` into an object), then sort highest first and keep the first `count`. Break ties by app name A to Z.
6. `formatMinutes(total)`: under an hour is `"45m"`. An hour or more is hours plus zero-padded minutes: `"1h 00m"`, `"2h 05m"`. Zero is `"0m"`.
7. Run the tests:

   ```bash
   npm test -- day-026
   ```

Try to solve these without a `for` loop. Loops still work, but the point of today is to get comfortable with the three tools.

## When you're stuck

- **`reduce` returns `NaN` or `undefined`** — you forgot the starting value (the second argument), or your callback doesn't `return` the new running total.
- **TypeScript complains about indexing `totals[session.category]`** — the `Category` type is a union of the four allowed strings, so it works as a key of `Record<Category, number>`. Make sure your starting object has all four keys.
- **`sort` changes your original data** — `sort` works in place. Sort a copy: `[...list].sort(...)`.
- **`"2h 5m"` instead of `"2h 05m"`** — pad the minutes: `String(minutes).padStart(2, "0")`.
- **Still stuck?** Read `solution/screen-time.ts`, then close it and write your own from memory.
