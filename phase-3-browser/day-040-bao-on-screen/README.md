# Day 40: Bao, Part 2 — Bao on Screen

Watch the video: *(not recorded yet)*

## The brief

Yesterday's rules engine gets a board. Tap one of your holes and watch the seeds travel round, one hole at a time: relays carry on, captures flash red as seeds cross the board, and the last hole a move reached stays marked so you can see what just happened. Then the computer thinks for a moment and replies. You can also switch to playing a friend on the same phone.

You don't touch the rules today. `bao.ts` is yesterday's finished engine, and the screen only ever *asks* it things: which moves are legal, what a move does, who won.

## What you'll use

- **Rendering from state**: one `draw()` function makes all 32 holes match the data. Nothing on screen is changed anywhere else
- **Replaying a log**: the engine's `Step[]` becomes an animation with `async` / `await` and a `wait(ms)` you pass in, so the tests can skip the waiting
- **Locking input** while a move plays, and a **generation counter** so pressing *New game* mid-move cancels the old animation cleanly
- A simple computer opponent: try every legal move (the engine never changes the state it's given, so trying is free) and keep the best
- **Accessible game UI**: real `<button>`s, labels a screen reader can read ("Your inner row, hole 3: 4 seeds"), a live region that announces each move, and `prefers-reduced-motion`

## The design, and why

`style.css` is written for you. Read it before you start. It's part of the lesson:

- **Design tokens.** Every colour, size and speed is a named CSS variable at the top (`--accent`, `--space-4`, `--speed`). The dark theme only redefines the tokens; no other rule changes.
- **The board tells you who owns what.** Each player's card sits next to their half of the board, and a line splits the halves. The player to move gets an orange outline and a "To move" pill.
- **Every state looks different**, so you never have to guess: a *playable* hole has a faint gold ring that gets strong on hover; the hole being sown glows amber; a *captured* hole flashes red; the hole where the last move *ended* keeps a white ring.
- **Disabled isn't greyed out.** You still need to count the opponent's seeds, so holes you can't play stay fully readable.
- **Seeds look like seeds.** Up to 12 bean shapes, each turned a little differently so a pile looks dropped by hand, plus the exact number on every hole.
- **Keyboard and touch.** `Tab` reaches every playable hole, with a strong blue focus ring. Buttons are at least 44 px tall.
- **Motion is optional.** With *reduce motion* turned on in your system settings, moves appear at once and CSS transitions switch off (`--speed: 0ms`).

## Steps

1. Start the dev server. The page stays empty until `app.ts` works, but you can read the layout in `index.html`.

   ```bash
   npm run dev -- phase-3-browser/day-040-bao-on-screen/starter
   ```

2. `starter/layout.ts`: `positionOf(player, hole)` gives the row and column where a hole appears, and `holeAt(row, col)` goes back the other way. The table is in the file. Facing holes must end up in the same column.
3. `starter/text.ts`: `holeLabel`, `describeMove` and `turnText`. All the wording lives in `PLAYERS`, so the computer and friend modes only differ in data.
4. `starter/ai.ts`: `chooseMove(state)`. Win if you can; otherwise capture the most seeds; ties go to the lowest hole.
5. `starter/app.ts`: the holes are already built. Write the rest, in the order the TODOs list:
   - `draw(highlight?)` sets every hole's dots, count, label, `disabled` and classes, and both player cards.
   - `animate(steps, game)` applies one step to `shown` (what's on screen), draws it, and waits. A capture takes the seeds out of the opponent's hole and adds them to the hole the last seed was sown in.
   - `move(hole)` plays the move, animates it, saves the new state, updates `#status`, and lets the computer reply.
   - `newGame()`, and the click, change and new-game listeners.
6. Run the tests:

   ```bash
   npm test -- day-040
   ```

7. Play a few games. Then turn on *reduce motion* (it's under Accessibility in most system settings) and play one more.

## When you're stuck

- **Clicking does nothing** — a disabled `<button>` never fires `click`. Check that your `draw()` enables your legal holes when it's your turn.
- **You can click twice and start two moves** — set `busy` *before* the first `await`, and check it in the click handler.
- **The seeds jump to the end instead of travelling** — you're drawing `state` during the animation. Draw `shown`, and only copy the new state into `shown` once the animation has finished.
- **New game mid-move leaves a mess** — the old animation keeps going after the reset. Check `game !== generation` after every `await` and stop.
- **The computer plays twice, or never** — after your move, only reply when there's no winner *and* it's player 1's turn.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
