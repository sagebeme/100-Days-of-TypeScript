# Phase 3 Recap: Browser and Games

Days 29–42. Your code moved onto a page: a link-in-bio site, forms, a flashcard app that remembers you, a print generator, pixel art, and two games, Rider Rush and Bao, shipped so anyone can play them from a link.

## What this phase taught

HTML and CSS that work for everyone, a typed DOM, Vite, forms, `fetch`, `localStorage`, Canvas, pointer events, game loops, a tested rules engine, sound, keyboard play and accessibility, and a real production build.

## Key ideas

1. **The page is untrusted territory.** `querySelector` can return `null`, an input's `.value` is always a string, and `instanceof HTMLInputElement` narrows an `Element` to the type that has `.value` (Day 30).
2. **Logic apart from the page.** `tick(state)`, `update(state, dt)` and `play(state, hole)` are pure functions that never touch the DOM, so they can be tested with plain data (Days 31, 37 and 39).
3. **Anything from outside gets checked.** `fetch` only throws when the network fails, so check `response.ok`. JSON and `localStorage` are `unknown` until a type guard says otherwise, and `localStorage` can throw (Days 33 and 34).
4. **Never put outside text into `innerHTML`.** Build elements and set `textContent`, so a name can't become a script (Day 33).
5. **Pass in the pieces you use.** `Pick<CanvasRenderingContext2D, ...>` and `Pick<Storage, "getItem">` let tests hand in a fake pen or a fake store (Days 34 and 35).
6. **A fixed time step.** Screens refresh at 60, 120 or fewer times a second, so the game moves by elapsed time, not by frames (Day 37).
7. **Render from state.** One `draw()` makes the screen match the data, and an animation is a replay of the engine's log of steps (Day 40).
8. **Accessible by design.** Real `<button>`s, labels a screen reader can read, a live region for what happened, keyboard controls, and pausing when the tab is hidden (Days 40 and 41).

## Self-test

1. Why does a form use `novalidate` in this course, and what does `data.get("email")` return?
2. Two rectangles: when do they overlap?
3. Why does `play(state, hole)` return a new state instead of changing the one it was given? Name two things that makes possible.
4. Why does the game's build use `base: "./"`?
5. Browsers block sound until something happens. What?

<details><summary>Answers</summary>

1. So the browser's own pop-up checks step aside for your messages, one per field. It returns `FormDataEntryValue | null`: a string, a file, or nothing.
2. When they overlap on the x axis *and* on the y axis.
3. Old states stay as they were, so undo is a list of old states, and a computer player can try every move for free.
4. Every link in the build is relative, so the game works in a sub-folder as well as at the root of a site.
5. The player has to interact with the page first, like a tap or a key press.

</details>

## Build it without steps

**A memory card game.** A grid of face-down cards with Nairobi landmarks; flip two at a time and find the pairs. Keep the rules in a pure, tested module (shuffling with an injected `random`, matching, moves, a win), draw it from state, play it with a mouse, a finger and a keyboard alone, keep the best score in `localStorage`, and ship a production build that works in a sub-folder.

No steps and no starter. Start with the rules and their tests; the page comes last.
