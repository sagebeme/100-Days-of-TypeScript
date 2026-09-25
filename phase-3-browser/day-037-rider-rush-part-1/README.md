# Day 37: Rider Rush, Part 1 — the Game Loop

Watch the video: *(not recorded yet)*

## The brief

You're a delivery rider with a hot order and Thika Road traffic in the way. Rider Rush is a three-lane game: cars come down the road at you, and you switch lanes to get past them. Today you build the engine: the road scrolls, traffic appears and moves, the rider steers, and the distance ticks up. Tomorrow, cars get dangerous.

```
createGame()                    →  { lane: 1, distance: 0, speed: 240, traffic: [], spawnIn: 1.2 }
steer(state, "left")            →  lane 0 (and never below 0 or above 2)
update(state, 1/60, random)     →  everything moved on by one sixtieth of a second
stepLoop(0.01, 0.05, 1/60)      →  { steps: 3, accumulator: ~0.01 }
```

## What you'll use

- **The game loop**: `requestAnimationFrame` calls you before every screen refresh, about 60 times a second, with a timestamp
- **A fixed time step**: screens refresh at different speeds (60 Hz, 120 Hz, a slow phone), so you never move things "one step per frame". You add up the real time that passed and run the game in fixed 1/60 s steps. Every device then plays the same game
- `update(state, dt)`: a pure function from one moment of the game to the next, like the study timer's `tick`, but with `dt` in seconds
- `keydown` for the arrow keys and A/D, plus on-screen buttons for phones
- Canvas `fillRect` and `fillText` for drawing, and the `Pen` trick from Day 35 so the tests can see what you drew

## Steps

1. Start the dev server. The page stays blank until `app.ts` works.

   ```bash
   npm run dev -- phase-3-browser/day-037-rider-rush-part-1/starter
   ```

2. In `starter/game.ts`, the sizes are written for you at the top. Write:
   - `laneCenter(lane)`: the x position of the middle of a lane.
   - `createGame()`: rider in the middle lane (1), distance 0, speed `BASE_SPEED`, no traffic, first car in `SPAWN_EVERY` seconds.
   - `steer(state, direction)`: one lane left or right, never off the road.
   - `update(state, dt, random)`, all of it scaled by `dt` so speed is in pixels per **second**:
     - distance grows by `speed × dt`
     - every car moves down by `speed × dt`, and a car whose top has reached `HEIGHT` is gone
     - `spawnIn` counts down by `dt`. At 0 or below, a car appears just above the screen (`y` is `-CAR_HEIGHT`) in lane `Math.floor(random() × LANES)`, and `spawnIn` goes back up by `SPAWN_EVERY`
   - `stepLoop(accumulator, frameSeconds, step)`: add the frame's time to the accumulator (but never more than `MAX_FRAME`, so a tab left in the background doesn't make the game jump), then take out as many whole steps as fit. Return how many steps to run and what's left over.
   - `formatDistance(distance)`: 10 pixels is 1 metre, so `1234` is `"123 m"`.
   - `render(pen, state)`: the road, dashed lane lines that slide with the distance (so the road looks like it's moving), the cars, the rider, and the distance in the top-left corner. Colours are up to you.
3. In `starter/app.ts`, write `mountRiderRush(root, options)`:
   - Get the 2D context from `#game` (throw `Canvas 2D is not supported here` if it's `null`) and size the canvas to `WIDTH × HEIGHT`.
   - `frame(now)`: work out the seconds since the last frame (`0` on the very first frame), ask `stepLoop` how many steps to run, run `update` that many times with `FIXED_DT`, then draw and show the distance in `#distance`. Finish by asking for the next frame.
   - `ArrowLeft` / `a` and `ArrowRight` / `d` on `document` steer. So do `pointerdown` on `#left` and `#right`.
   - Return a `stop()` function that cancels the next frame and removes the key listener.
   - The browser's `requestAnimationFrame` comes in through `options`, so the tests can call your frames by hand with made-up timestamps.
4. Run the tests:

   ```bash
   npm test -- day-037
   ```

5. Play it. Nothing can hurt you yet, so ride as far as you like.

## When you're stuck

- **Everything moves twice as fast on a gaming laptop** — you're moving things per frame. Move them per *second*: multiply by `dt`.
- **The game jumps forward after switching tabs** — browsers pause `requestAnimationFrame` in hidden tabs, so the next frame is a long one. That's what `MAX_FRAME` is for.
- **`stepLoop` returns 2.9999 steps** — steps are whole numbers. Take steps out with a `while (accumulator >= step)` loop.
- **The arrow keys scroll the page** — call `event.preventDefault()` for the keys you use.
- **Cars pile up forever** — filter out the ones that have left the bottom of the screen.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
