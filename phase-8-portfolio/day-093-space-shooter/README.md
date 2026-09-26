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

## Done when

```bash
npm test -- day-093
npx vite phase-8-portfolio/day-093-space-shooter/starter
```

## Stretch

- Shields to hide behind, that bombs and shots chip away.
- A mystery ship across the top, worth a random bonus.
- Record the keys and seed of a great game, and replay it.
