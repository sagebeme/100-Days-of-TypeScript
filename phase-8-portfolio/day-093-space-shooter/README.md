# Day 93: Space Shooter

*A brief and a test suite. No walkthrough.*

## The brief

Build a Space Invaders-style shooter: a formation of aliens marches across the sky over Nairobi, stepping down at each edge and speeding up as it thins out. You move along the bottom and shoot. They drop bombs. Clear a wave and a faster one arrives; lose your lives, or let them land, and it's game over.

The twist: **the game is testable**. `engine.ts` has no canvas and no clock in it. It's a world, and `update(world, keys)` returns the world 1/60 of a second later. The page just draws it.

## The rules (tested)

- **Repeatable randomness**: `random(seed)` (mulberry32) returns a number and the next seed. The seed lives *in the world*, so the same seed and the same keys play exactly the same game. That's what makes replays, and tests, possible.
- **The player** moves at a steady speed and stays on screen, and fires no faster than the cooldown.
- **The formation** (8 × 5) marches across; at an edge it steps down 16px and turns round. It speeds up as it thins out, and wave by wave. Each wave starts a little lower.
- **Hits** are box overlaps. A shot destroys one enemy and scores by its row (top row 50). A bomb costs a life, then shields the player for 2 seconds. The last life, or the formation reaching the player's row, is game over. After that, nothing moves.
- **A cleared wave** brings the next one.
- `update` never changes the world it was given.
- **Fixed steps**: screens run at 30, 60 or 144 frames a second. `advance` runs as many whole 1/60 s steps as fit in the time since the last frame and carries the rest over, so the game moves the same everywhere. After a long pause it catches up at most a quarter of a second.

## The page (yours to design)

Draw it on a canvas scaled to fit the screen. Keys, and touch buttons on phones. A score line, a start screen, a pause (P, and whenever the window loses focus, so no key gets stuck down), a game-over screen, and a best score in `localStorage`. With reduced motion on, keep the background still.

## Steps

1. Read the tests, then the types and constants in `engine.ts`. A box's `x` and `y` are its centre.
2. `random` (mulberry32), `overlaps`, `formation`, `marchSpeed`, then `newWorld`. `npm test -- day-093 -t "randomness"`.
3. `update`, a piece at a time: the player and firing, then the march, then shots, bombs and hits, then game over and the next wave.
4. `advance`: whole steps, the carry, and the quarter-second cap. `npm test -- day-093 -t "fixed-step"`.
5. Run the tests, then draw it in `main.ts` with `requestAnimationFrame` calling `advance` (the commands under "Done when").

## Done when

```bash
npm test -- day-093
npx vite phase-8-portfolio/day-093-space-shooter/starter
```

## Stretch

- Shields to hide behind, that bombs and shots chip away.
- A mystery ship across the top, worth a random bonus.
- Record the keys and seed of a great game, and replay it.

## Check yourself

1. Why does the seed live in the world, and what breaks if one `Math.random()` slips into `update`?
2. Predict `advance(world, keys, 0.04, 0)`: how many steps, and how much carries over? And for an `elapsed` of 5 seconds after a pause?
3. Predict `overlaps` for two 10 × 10 boxes centred 10px apart, and 9px apart.
4. Why is `update(world, keys)` a function that returns a new world, with no canvas and no clock?

<details><summary>Answers</summary>

1. The same seed and the same keys then play exactly the same game, which is what makes tests and replays possible. One `Math.random()` gives a different game every run.
2. 2 steps, with about 0.0067 seconds carried over (0.04 minus two 1/60 s steps). And 15 steps, because a long pause catches up at most a quarter of a second.
3. `false` (edges touching don't overlap) and `true`.
4. Then the game's rules can be tested a step at a time, and they run the same on a 30, 60 or 144 Hz screen. The page only draws whatever world it's given.

</details>

## When you're stuck

- **The same seed plays two different games** — every random roll must come from `random(world.seed)`, and the new seed must go back into the world you return. One `Math.random()` anywhere breaks it.
- **"never changes the world it was given" fails** — copy before you change: `{ ...world.player }`, `world.enemies.map((e) => ({ ...e }))`, new arrays for shots and bombs.
- **The formation slides off the edge before turning** — move it, check whether any enemy's edge (`x ± w / 2`) went past the screen, and if so turn round and step everyone down 16px instead.
- **The player fires every frame** — keep a `cooldown` on the player, count it down by `STEP` each update, and only fire (and reset it to `COOLDOWN`) when it's 0.
- **Two bombs take two lives** — after a hit, set the shield to `SHIELD` and ignore bombs until it has counted down to 0.
- **`advance` takes one step too few** — `0.04 - 2 * STEP` can come out as `0.0166…66` just under `STEP` in floating point. Compare with a tiny allowance (`time >= STEP - 1e-9`), and cap `elapsed` at 0.25 before you start.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
