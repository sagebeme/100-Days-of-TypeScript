# Day 31: Lo-fi Study Timer — Vite and TypeScript

Watch the video: *(not recorded yet)*

## The brief

Exams are close. Put the lo-fi playlist on and study in blocks: 25 minutes of focus, then a 5-minute break, then repeat. Build the timer. It counts down on the page and in the browser tab title, switches between focus and break on its own, and counts how many focus sessions you've finished.

```
 FOCUS           BREAK           FOCUS
 25:00 → 00:00 → 05:00 → 00:00 → 25:00 ...
 Sessions done: 0         1                 1
```

Yesterday you ran `npm run dev` without knowing what it did. Today you find out.

## What you'll use

- **Vite**, the dev server and build tool behind `npm run dev`
- A pure state machine: `tick(state)` returns the next state, and never touches the page
- `setInterval` / `clearInterval` to call `tick` once a second
- `document.title`, so the countdown shows in the tab while you're on another one

## What Vite does

Browsers only understand JavaScript. When `index.html` asks for `main.ts`, Vite strips the types out on the spot and sends the browser the JavaScript. It's the same trick Node does for your terminal projects.

| Command | What it does |
| --- | --- |
| `npm run dev -- <folder>` | Starts a dev server for that folder. Save a file and the page updates by itself. |
| `npx vite build <folder>` | Makes the production version: plain, minified JavaScript in `<folder>/dist`. |
| `npx vite preview <folder>` | Serves the `dist` build, so you can check it before you ship it. |

Two things Vite does **not** do: it doesn't check your types (that's still `npm run typecheck`), and it doesn't run your tests (that's still `npm test`).

## Steps

1. Start the dev server and leave it running:

   ```bash
   npm run dev -- phase-3-browser/day-031-study-timer/starter
   ```

   Open the page. Change the `<h1>` in `index.html` and save. The page updates without a reload.
2. In `starter/timer.ts`, write the pure functions. None of them change the state they're given; they return a new one.
   - `createTimer(settings)`: a focus phase, `focusMinutes × 60` seconds left, not running, 0 sessions done.
   - `toggle(state)`: flips `running`.
   - `tick(state, settings)`: does nothing while paused. Otherwise takes one second off. When it reaches 0, it switches phase: focus becomes break (and `sessionsDone` goes up by 1), break becomes focus. The clock restarts at the full length of the new phase, and it keeps running.
   - `reset(state, settings)`: back to the start of a paused focus session. Keep `sessionsDone`.
   - `formatClock(seconds)`: `1500` → `"25:00"`, `249` → `"04:09"`.
3. In `starter/app.ts`, write `mountTimer(root, settings)`:
   - `#start` toggles the timer. Its text is `Start` while paused and `Pause` while running.
   - While running, a `setInterval` calls `tick` every 1000 ms. Pausing clears it.
   - `#reset` resets the timer and stops the interval.
   - After every change, draw: `#clock` shows the time, `#phase` shows `Focus` or `Break`, `#sessions` shows the count, and `document.title` is `24:59 · Focus`.
   - Return a function that clears the interval. The tests call it to clean up.
4. Run the tests. The tests don't wait 25 real minutes: they use fake timers that skip ahead.

   ```bash
   npm test -- day-031
   ```

5. Build it for production and look at what came out:

   ```bash
   npx vite build phase-3-browser/day-031-study-timer/starter
   npx vite preview phase-3-browser/day-031-study-timer/starter
   ```

   Open `starter/dist/assets/`. That one `.js` file is all your TypeScript, with the types removed and the code squeezed small. `dist/` is ignored by git.

## When you're stuck

- **The timer runs twice as fast after pressing Start twice** — each press started a new interval. Keep the interval id in a variable and clear it when you pause.
- **`Type 'Timeout' is not assignable to type 'number'`** — this repo also has Node's types loaded. Use `ReturnType<typeof setInterval>` for the variable's type.
- **The clock goes negative** — switch phase when `secondsLeft` reaches 0, not when it goes below.
- **The page changes, but the tests say the clock is wrong** — draw after *every* change, including right after mounting.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
