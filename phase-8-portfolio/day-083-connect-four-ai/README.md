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

## Steps

1. Read the tests. `parseBoard`, `emptyBoard` and `other` are already written.
2. `landingRow`, `validMoves`, `drop`, `winner` and `isFull`. `npm test -- day-083 -t "the rules"`.
3. `evaluate`: windows of four, the centre column worth more.
4. `bestMove`: minimax with alpha-beta, using `evaluate` when it runs out of depth. `npm test -- day-083 -t "the computer"`.
5. Build the page in `main.ts` and `index.html`, and try to beat it on hard (the commands under "Done when").

## Done when

```bash
npm test -- day-083
npx vite phase-8-portfolio/day-083-connect-four-ai/starter
```

## Stretch

- Run the computer's thinking in a Web Worker, so the page never freezes.
- An "undo" button, and a hint button that shows what the computer would play.
- A transposition table: remember positions already scored.

## When you're stuck

- **The old board changes after `drop`** — copy the rows (`board.map((row) => [...row])`) and change the copy. Row 0 is the top, so the disc lands on the highest-numbered empty row.
- **`evaluate` isn't 0 on an empty board, or doesn't flip sign** — score it as "my windows minus theirs". Then the empty board is 0 and the other player's score is the negative.
- **It plays elsewhere when it could win now** — a win found sooner must score higher: add the depth left to the win score (`WIN + depth`), and subtract it for a loss.
- **Hard mode takes more than 2 seconds** — try the columns centre-out (`3, 2, 4, 1, 5, 0, 6`) and stop looking at a position's other moves once `alpha >= beta`.
- **It walks into your win** — check for a winner before checking the depth, so a won or lost position is never scored by `evaluate`.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
