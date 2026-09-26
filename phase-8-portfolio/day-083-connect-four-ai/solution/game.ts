// Connect Four: the rules, and a computer player that thinks ahead.

export const ROWS = 6;
export const COLS = 7;
export type Player = 1 | 2;
export type Cell = Player | 0;
export type Board = readonly (readonly Cell[])[]; // board[row][col], row 0 at the top

export function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => new Array<Cell>(COLS).fill(0));
}

export const other = (player: Player): Player => (player === 1 ? 2 : 1);

// The lowest empty row in a column, or -1 when it's full.
export function landingRow(board: Board, col: number): number {
  for (let row = ROWS - 1; row >= 0; row--) if (board[row][col] === 0) return row;
  return -1;
}

export function validMoves(board: Board): number[] {
  return Array.from({ length: COLS }, (_, c) => c).filter((c) => board[0][c] === 0);
}

// A new board with the disc dropped in. The old board is never changed.
export function drop(board: Board, col: number, player: Player): Board {
  if (!Number.isInteger(col) || col < 0 || col >= COLS) throw new Error(`There's no column ${col}`);
  const row = landingRow(board, col);
  if (row === -1) throw new Error(`Column ${col} is full`);
  return board.map((cells, r) => (r === row ? cells.map((cell, c) => (c === col ? player : cell)) : cells));
}

const DIRECTIONS = [
  [0, 1], // across
  [1, 0], // down
  [1, 1], // diagonal ↘
  [1, -1], // diagonal ↙
] as const;

// The winner and the four (or more) cells in a row, or null.
export function winner(board: Board): { player: Player; cells: [number, number][] } | null {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const player = board[row][col];
      if (player === 0) continue;
      for (const [dr, dc] of DIRECTIONS) {
        const cells: [number, number][] = [];
        let r = row;
        let c = col;
        while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
          cells.push([r, c]);
          r += dr;
          c += dc;
        }
        if (cells.length >= 4) return { player, cells };
      }
    }
  }
  return null;
}

export const isFull = (board: Board) => validMoves(board).length === 0;

// --- The computer player ---

// How good a board looks for `player`, without looking ahead: every window of 4 cells in a line is
// scored by how many of your discs it holds and whether the opponent has blocked it. The centre
// column is worth a little extra: more lines go through it.
export function evaluate(board: Board, player: Player): number {
  const opponent = other(player);
  let score = 0;
  for (let row = 0; row < ROWS; row++) if (board[row][3] === player) score += 3;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      for (const [dr, dc] of DIRECTIONS) {
        const endR = row + dr * 3;
        const endC = col + dc * 3;
        if (endR < 0 || endR >= ROWS || endC < 0 || endC >= COLS) continue;
        let mine = 0;
        let theirs = 0;
        for (let i = 0; i < 4; i++) {
          const cell = board[row + dr * i][col + dc * i];
          if (cell === player) mine++;
          else if (cell === opponent) theirs++;
        }
        if (mine && theirs) continue; // a blocked window is worth nothing to either side
        if (mine === 3) score += 5;
        else if (mine === 2) score += 2;
        if (theirs === 3) score -= 4;
      }
    }
  }
  return score;
}

const WIN = 1_000_000;

// Moves nearest the centre first: they're usually best, so alpha-beta can skip more of the rest.
const ORDER = [3, 2, 4, 1, 5, 0, 6];

// Minimax with alpha-beta pruning: assume both sides play their best, and look `depth` moves ahead.
// A quicker win (or a slower loss) scores better, so the computer finishes the job and fights on.
function minimax(board: Board, depth: number, alpha: number, beta: number, toMove: Player, me: Player): number {
  const won = winner(board);
  if (won) return won.player === me ? WIN + depth : -WIN - depth;
  if (isFull(board)) return 0;
  if (depth === 0) return evaluate(board, me);
  const moves = ORDER.filter((c) => board[0][c] === 0);
  if (toMove === me) {
    let best = -Infinity;
    for (const col of moves) {
      best = Math.max(best, minimax(drop(board, col, toMove), depth - 1, alpha, beta, other(toMove), me));
      alpha = Math.max(alpha, best);
      if (alpha >= beta) break; // the opponent would never let the game get here
    }
    return best;
  }
  let best = Infinity;
  for (const col of moves) {
    best = Math.min(best, minimax(drop(board, col, toMove), depth - 1, alpha, beta, other(toMove), me));
    beta = Math.min(beta, best);
    if (alpha >= beta) break;
  }
  return best;
}

export const LEVELS = { easy: 1, medium: 3, hard: 6 } as const;
export type Level = keyof typeof LEVELS;

export function bestMove(board: Board, player: Player, depth: number): number {
  const moves = ORDER.filter((c) => board[0][c] === 0);
  if (moves.length === 0) throw new Error("The board is full");
  let bestCol = moves[0];
  let bestScore = -Infinity;
  for (const col of moves) {
    const score = minimax(drop(board, col, player), depth - 1, -Infinity, Infinity, other(player), player);
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }
  return bestCol;
}

// For tests and sharing: a board from rows of text, "." empty, "X" player 1, "O" player 2.
export function parseBoard(rows: string[]): Board {
  if (rows.length !== ROWS || rows.some((r) => r.length !== COLS)) throw new Error(`A board is ${ROWS} rows of ${COLS}`);
  return rows.map((row) => [...row].map((ch): Cell => (ch === "X" ? 1 : ch === "O" ? 2 : 0)));
}
