# Day 24: Premier League Table — CSV, Type Guards and Untrusted Data

Watch the video: *(not recorded yet)*

## The brief

Give the program a list of match results as CSV text and get back a league table: played, won, drawn, lost, goals for and against, goal difference, points. This is your first program that reads data it didn't create, so it can't assume the data is any good.

```
home,away,homeGoals,awayGoals
Arsenal,Chelsea,2,1
Chelsea,Liverpool,0,0
Liverpool,Arsenal,1,3
```

```
  Team       P  W  D  L  GF GA GD Pts
1 Arsenal    2  2  0  0  5  2  3  6
2 Chelsea    2  0  1  1  1  2 -1  1
3 Liverpool  2  0  1  1  1  3 -2  1
```

## What you'll use

- `string.split` to turn text into lines and lines into cells
- A **type guard**: a function whose return type is `value is Match`. When it returns `true`, TypeScript treats the value as a `Match` from then on
- `unknown` for data you haven't checked yet
- Sorting with several rules at once (points, then goal difference, then goals scored, then name)
- Why you must never trust a CSV file: Excel on Windows saves lines ending in `\r\n`, and fields can be empty or not numbers at all

## Steps

1. Open `starter/premier-league.ts`. The `Match` and `TableRow` types are written.
2. Write the type guard `isMatch(value: unknown): value is Match`. It's `true` only when the value is an object, `home` and `away` are non-empty strings, and both goal counts are non-negative whole numbers. Check with `typeof`, not by trusting.
3. Write `parseMatches(csv)`:
   - Split into lines with `csv.split(/\r?\n/)` so both `\n` and `\r\n` work.
   - Skip the header line, and skip blank lines.
   - Split each line on commas and trim each cell. A line must have exactly 4 cells.
   - Build a candidate object with the goals converted using `Number(...)`. Careful: `Number("")` is `0`, so treat an empty goals cell as `NaN` yourself.
   - If `isMatch(candidate)` is false, throw `new Error("Line <n> is not a valid match: <line>")`, where `<n>` counts from 1 and includes the header line.
4. Write `buildTable(matches)`. A win is 3 points, a draw 1, a loss 0. Sort by points, then goal difference, then goals for (all highest first), then team name A to Z.
5. Run the tests:

   ```bash
   npm test -- day-024
   ```

## When you're stuck

- **A `\r` shows up on the last team name** — the CSV has Windows line endings. Splitting on `"\n"` alone leaves the `\r` behind; use `/\r?\n/`.
- **"Property 'home' does not exist on type 'object'"** — inside the guard, cast after you've checked it's an object: `const candidate = value as Record<string, unknown>;`.
- **A row with an empty goals cell passes validation** — `Number("")` is `0`. Turn empty strings into `NaN` before you build the candidate.
- **Wrong line number in the error message** — the header is line 1, so the first result is line 2.
- **Still stuck?** Read `solution/premier-league.ts`, then close it and write your own from memory.
