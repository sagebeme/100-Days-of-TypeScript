# Day 89: Project Board

*A brief and a test suite. No walkthrough.*

## The brief

Build a kanban board for the team launching Tikiti: To do, Doing, Done. Cards with labels, search and filters. And the rule that keeps teams sane: **Doing holds at most 3 cards**. Finish something before starting something new.

Most drag-and-drop boards shut out anyone who can't use a mouse. Yours must work with a finger, a mouse, **and a keyboard alone**.

## The rules (tested)

`board.ts` is a reducer: `reduce(board, action)` returns `{ board, error }`. An action that breaks a rule leaves the board untouched, with a reason a person can read. It never changes the board it was given.

- **Add** a card (a title is required and tidied; ids are unique). **Edit** its title and labels (no repeats). **Delete** it.
- **Move** a card to any column at any position (positions out of range are clamped).
- **Work-in-progress limits**: a full column refuses cards coming in ("Doing is full (3 at most). Finish something first."), but can still reorder its own cards. A limit can't be set below what a column already holds.
- **Keyboard moves**: `moveBy(board, cardId, "up" | "down" | "left" | "right")` gives the move action, or `null` at an edge. Moving left or right lands at the same position.
- **Finding**: every word of the search must match the title or a label, and a label filter.
- **Saved boards**: version 1 of the app saved `{ columns: [{ id, title, tasks: [{ id, text }] }] }`. `load` upgrades those, keeping every task. People's work matters more than tidy code. Anything unreadable starts a fresh board.

## The page (yours to design)

Drag-and-drop, and the accessible pattern for the keyboard: focus a card, **Space** picks it up, the **arrow keys** move it, **Space** drops it, **Escape** puts it back. Announce each step in a live region ("Doing, position 2 of 3"). Show each column's count against its limit, and refusals in words. On a phone, the board scrolls sideways; the page itself mustn't.

## Steps

1. Read the tests, then the types in `board.ts`. `emptyBoard` and `columnOf` are already written.
2. `reduce`, one action at a time: `add`, `move`, `edit`, `delete`, then `setLimit`. `npm test -- day-089 -t "the board"`, then `-t "moving cards"`.
3. `moveBy`, then `visibleCards`.
4. `load`: today's boards as they are, version 1 boards upgraded, anything else a fresh board.
5. Run the tests, then build the page in `main.ts`, and try moving a card with the keyboard alone (the commands under "Done when").

## Done when

```bash
npm test -- day-089
npx vite phase-8-portfolio/day-089-project-board/starter
```

Unplug your mouse and move a card from To do to Done.

## Stretch

- Undo and redo (the reducer makes this nearly free: keep a list of boards).
- Due dates, with overdue cards highlighted.
- Real-time sharing between teammates, with Day 88's WebSockets.

## When you're stuck

- **"never changes the board it was given" fails** — `push` and `splice` on the old `cardIds` change the board you were given. Build new arrays and objects (`[...ids]`, `{ ...board.cards }`) and return those.
- **Reordering lands one place off** — take the card out first, then clamp `toIndex` to `0`…the column's new length, then insert it.
- **A full Doing column refuses its own cards** — only count a move against the limit when the card comes from *another* column.
- **A refused action returns a copy** — the test checks it's the very same board (`toBe`). On an error, return the `board` you were given.
- **Search misses `BACKEND`, or matches any word** — lowercase both sides, split the search into words, and every word must be in the title or one of the labels.
- **An old board loses its tasks** — a version 1 column has `tasks: [{ id, text }]`. Each task becomes a card with `title: text` and no labels, and the column keeps its order in `cardIds`.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
