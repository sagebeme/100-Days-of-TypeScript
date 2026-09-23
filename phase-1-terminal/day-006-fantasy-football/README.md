# Day 6: Fantasy Football Points Tally

Watch the video: *(not recorded yet)*

## The brief

Your fantasy Premier League team scores points for goals, assists, and clean sheets. Write a function that adds up a whole squad's points for the gameweek.

Scoring: 4 points per goal, 3 points per assist, 4 points for a clean sheet.

```
calculateFantasyPoints([
  { goals: 2, assists: 1, cleanSheet: false },
  { goals: 0, assists: 0, cleanSheet: true },
])
→ 15   // (2×4 + 1×3) + (4) = 11 + 4
```

## What you'll use

- `for...of`, which loops over the *values* in an array (as opposed to a plain `for` loop, which loops over index numbers)
- Arrays of objects, and reading properties off each one inside the loop

## Steps

1. Open `starter/fantasy-football.ts`.
2. Declare `let total = 0`.
3. Loop `for (const player of players)`.
4. Inside the loop, add `player.goals * 4` and `player.assists * 3` to `total`.
5. If `player.cleanSheet` is `true`, add `4` more.
6. Return `total` after the loop ends.

```bash
npm test -- day-006
```

## When you're stuck

- **"Property 'goals' does not exist on type..."** — check the parameter type matches the shape you're actually looping over: an array of objects with `goals`, `assists`, and `cleanSheet`.
- **Total comes out too low** — the clean-sheet bonus is a separate `if` *inside* the loop, not something you add once at the end. Each clean-sheet player adds their own 4 points.
- **Still stuck?** Read `solution/fantasy-football.ts`, then close it and write your own from memory.
