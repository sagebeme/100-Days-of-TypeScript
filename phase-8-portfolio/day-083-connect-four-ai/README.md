# Day 83: Connect Four AI

*A brief and a test suite. No walkthrough.*

## The brief

Build Connect Four against a computer player that's actually hard to beat on its hardest level, and fun (beatable) on its easiest.

## The rules (tested)

- A 6 × 7 board; a disc drops to the lowest free row. `drop` returns a **new** board and never changes the old one. A full column, or a column that doesn't exist, is an error.
- `winner` finds four in a row across, down or on either diagonal, and says which cells, so the page can light them up.
- `parseBoard` reads boards written as text ("." "X" "O"), which is how the tests describe positions.

## The computer player (tested)

- **Minimax with alpha-beta pruning.** Assume both sides play their best, and look *depth* moves ahead: 1, 3 or 6 for easy, medium and hard.
- **An evaluation** for positions it can't see to the end: count the windows of four each side could still fill. The centre column is worth more.
- It must **take a win** when it has one, **block** yours, prefer winning to blocking, and never play a move that hands you an immediate win.
- A **quicker** win must score better than a slower one, or it will dawdle when it could finish.
- Hard mode must answer in under 2 seconds. Trying the centre columns first lets alpha-beta skip far more.

## The page (yours to design)

It must be playable with a mouse, a finger and a keyboard: arrow keys to choose a column, Enter to drop. Say what happened in words too (a status line screen readers announce), not only with colours. Stretch it with a falling-disc animation, and turn it off for people who prefer reduced motion.

## Done when

```bash
npm test -- day-083
npx vite phase-8-portfolio/day-083-connect-four-ai/starter
```

## Stretch

- Run the computer's thinking in a Web Worker, so the page never freezes.
- An "undo" button, and a hint button that shows what the computer would play.
- A transposition table: remember positions already scored.
