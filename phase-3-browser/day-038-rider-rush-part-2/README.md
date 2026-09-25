# Day 38: Rider Rush, Part 2 — Collisions, Score and Levels

Watch the video: *(not recorded yet)*

## The brief

Yesterday's road was safe. Today it isn't. Hit a car and the ride is over. Every car you get past is a point. Every 300 m the level goes up: the traffic gets faster and comes more often. Your best score is saved in the browser, so there's always something to beat. When you crash, press Space (or tap **Ride again**) to go again.

```
overlaps({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 })   →  true
overlaps({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 })  →  false (only touching)
levelFor(6500)       →  3
speedFor(3)          →  320
spawnEveryFor(3)     →  1.0 seconds between cars (never faster than 0.5)
```

The `starter/` folder already holds a finished Part 1, so you start from a working game.

## What you'll use

- **Axis-aligned bounding boxes (AABB)**: two rectangles overlap when they overlap on the x axis *and* on the y axis. Almost every 2D game starts with this check
- A `status` field, `"running" | "over"`: a small state machine that decides what `update` and `steer` are allowed to do
- Difficulty as small, testable functions of the level, instead of numbers scattered through the code
- `localStorage` again (Day 34) for the best score, with the same "never trust it, never crash on it" rules

## Steps

1. Start the dev server and play Part 1 for a minute:

   ```bash
   npm run dev -- phase-3-browser/day-038-rider-rush-part-2/starter
   ```

2. In `starter/game.ts`, `GameState` has three new fields: `status`, `score` and `level`. `createGame()` already sets them. Write:
   - `overlaps(a, b)`: `true` if the boxes overlap. Boxes that only touch along an edge don't count.
   - `riderBox(state)` and `carBox(car)`: the same rectangles `render` draws.
   - `levelFor(distance)`: level 1 at the start and one more every `LEVEL_EVERY` pixels.
   - `speedFor(level)` and `spawnEveryFor(level)`, from the constants at the top of the file.
   - `loadBest` / `saveBest`: like Day 34's `loadProgress` / `saveProgress`, for one number. Anything that isn't a whole number above 0 loads as `0`.
3. Grow `update` (the TODOs show where):
   - Once `status` is `"over"`, return the state unchanged. Nothing moves after a crash.
   - Each car that leaves the bottom of the screen adds 1 to the score.
   - The next car comes after `spawnEveryFor(state.level)` seconds.
   - Set `level` from the new distance, and `speed` from that level.
   - Last: if any car's box overlaps the rider's box, `status` becomes `"over"`.
4. `steer` does nothing once the game is over. `render` adds `Level 2` and `Score 7` to the corners and, after a crash, darkens the road and writes `Crashed!` in the middle.
5. In `starter/app.ts`:
   - Load the best score when the app starts, and show the score and best in `#score` and `#best` on every frame.
   - Stop running steps as soon as the game is over, and handle the crash **once**: if the score beats the best, save it and say `Crashed! New best: 12.`, otherwise `Crashed! Score 7. Best 12.` Put the message in `#message`, then show and focus `#restart`.
   - `#restart`, Space or Enter (only after a crash) start a fresh game, clear the message and hide the button.
6. Run the tests:

   ```bash
   npm test -- day-038
   ```

7. Play. What's your best?

## When you're stuck

- **You crash the moment the game starts** — check `overlaps` with the numbers: in Part 1, cars start above the screen, at `y = -CAR_HEIGHT`.
- **You crash when a car is only next to you** — lanes are 100 px wide and cars are 60 px, so cars in other lanes never overlap. Check that `carBox` uses `laneCenter(car.lane)`.
- **The score keeps going up after a crash** — `update` must return early when the status is `"over"`.
- **The best score is saved over and over** — only handle the crash on the step where the status *changes* to `"over"`.
- **Space scrolls the page instead of restarting** — `preventDefault()` for Space.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
