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

## Done when

```bash
npm test -- day-094
npx vite phase-8-portfolio/day-094-football-stats-dashboard/starter
```

## Stretch

- A page per club: results, scorers, and home against away.
- "What if" mode: change a result and watch the table move.
- The table as it stood on any matchday, with a slider.
