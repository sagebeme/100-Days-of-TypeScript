# Day 94: Football Stats Dashboard

*A brief and a test suite. No walkthrough.*

## The brief

Build the dashboard a football fan checks every Monday morning: the league table with each club's form, the race for the title as a chart, the top scorers, and the headline numbers. `season.csv` has a whole season of a made-up league: 8 clubs, 56 matches, every goal and who scored it. Anyone can load their own season's CSV instead.

## The rules (tested)

- **Reading CSV**: `date,home,away,home_goals,away_goals,scorers`, with scorers written `player|team|minute` and separated by `;`. Matches come out in date order. Bad lines are skipped, and each one is reported with its line number and a reason: a date not like `2026-08-15`, a team playing itself, a score that isn't whole numbers, a scorer for a team not in the match, or scorers that don't add up to the score.
- **The table**: 3 points for a win, 1 for a draw. Played, won, drawn, lost, goals for and against, goal difference, points, and form (the last five, oldest first). Level on points, rank by goal difference, then goals scored, then name.
- **Top scorers**, most first (ties by name). Two players with the same name at different clubs are different players.
- **Head to head** between two clubs, home and away, and a club's **points after each match**, for the chart.
- **Chart ticks**: round steps (1, 2, 5 or 10 times a power of ten) that cover the highest value: `0, 10, 20, 30, 40` for 34.

## The page (yours to design)

Draw the chart yourself in SVG. No chart library: you've got `pointsRace` and `niceTicks`. Let people pick a club to follow on the chart. Mark the champions and the relegation places with more than colour. On a phone, make sure points stay visible. And escape everything from a loaded CSV: it's typed by somebody.

## Steps

1. Read the tests, the types in `stats.ts`, and the first lines of `season.csv`.
2. `parseResults`: split into lines, skip the header and blank lines, check each line in the order of the errors in the test. `npm test -- day-094 -t "reading a season"`.
3. `leagueTable`, with the tie-breaks and form. `npm test -- day-094 -t "the table"`.
4. `topScorers`, `headToHead`, `pointsRace`, then `niceTicks`.
5. Run the tests, including the sample season, then build the page in `main.ts` with an SVG chart you draw yourself (the commands under "Done when").

## Done when

```bash
npm test -- day-094
npx vite phase-8-portfolio/day-094-football-stats-dashboard/starter
```

## Stretch

- A page per club: results, scorers, and home against away.
- "What if" mode: change a result and watch the table move.
- The table as it stood on any matchday, with a slider.

## Check yourself

1. Predict the output: `niceTicks(34)`, `niceTicks(1200)` and `niceTicks(7)`
2. Line 4 of a CSV has `one` as the home score. Why test the text with `/^\d+$/` instead of using `Number` or `parseInt`?
3. A line says Simba 1–0 Kifaru, scored by `Ian|Chui|10`. Predict the error.
4. Two players called Ian score 8 each, one for Simba and one for Chui. Why must the top scorers count them apart, and how?

<details><summary>Answers</summary>

1. `[0, 10, 20, 30, 40]`, `[0, 500, 1000, 1500]` and `[0, 2, 4, 6, 8]`.
2. `Number("")` is `0` and `parseInt("1x")` is `1`, so bad scores would quietly pass as numbers. The error is `Line 4: the score must be whole numbers`.
3. `` Line N: can't read the scorer "Ian|Chui|10" `` (with that line's number): Chui isn't in the match.
4. They're different players, and adding them together would invent a 16-goal striker. Key the count on player and team, like `` `${player}|${team}` ``.

</details>

## When you're stuck

- **The line numbers in the errors are off** — count every line of the file, header and blank lines included, from 1. Skip blank lines, but don't renumber.
- **`"one"` passes as a score** — `Number("")` is 0 and `parseInt("1x")` is 1. Test the text with `/^\d+$/` before converting.
- **A scorer for the wrong team is accepted** — split each scorer on `|` into exactly three parts, and the team must be the home or away side. When a line lists scorers, each team's count must match its score; a line with none is fine.
- **Ties come out in the wrong order** — one `sort` comparing points, then goal difference, then goals scored (all highest first), then `a.team.localeCompare(b.team)`.
- **Form has more than five, or newest first** — sort the results by date, push each outcome, and keep `form.slice(-5)`.
- **Two "Ian"s are added together** — key the count on player *and* team, like `` `${player}|${team}` ``.
- **`niceTicks(1200)` gives 240 or 300** — divide the max by the count, find its power of ten, and take the first of 1, 2, 5 or 10 times that which is at least as big. Then count up to the first tick at or above the max.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
