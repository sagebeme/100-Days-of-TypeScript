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
