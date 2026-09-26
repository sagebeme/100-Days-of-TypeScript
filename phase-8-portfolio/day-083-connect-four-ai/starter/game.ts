// Connect Four: the rules, and a computer player that thinks ahead. The tests are the spec.
export const ROWS = 6;
export const COLS = 7;
export type Player = 1 | 2;
export type Cell = Player | 0;
export type Board = readonly (readonly Cell[])[]; // board[row][col], row 0 at the top

export const LEVELS = { easy: 1, medium: 3, hard: 6 } as const; // how many moves ahead the computer looks
export type Level = keyof typeof LEVELS;

export function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => new Array<Cell>(COLS).fill(0));
}

export const other = (player: Player): Player => (player === 1 ? 2 : 1);

// A board from rows of text: "." empty, "X" player 1, "O" player 2.
export function parseBoard(rows: string[]): Board {
  if (rows.length !== ROWS || rows.some((r) => r.length !== COLS)) throw new Error(`A board is ${ROWS} rows of ${COLS}`);
  return rows.map((row) => [...row].map((ch): Cell => (ch === "X" ? 1 : ch === "O" ? 2 : 0)));
}

export function landingRow(board: Board, col: number): number {
  throw new Error(`TODO: landingRow(${board.length}, ${col})`);
}

export function validMoves(board: Board): number[] {
  throw new Error(`TODO: validMoves(${board.length})`);
}

export function drop(board: Board, col: number, player: Player): Board {
  throw new Error(`TODO: drop(${board.length}, ${col}, ${player})`);
}

export function winner(board: Board): { player: Player; cells: [number, number][] } | null {
  throw new Error(`TODO: winner(${board.length})`);
}

export function isFull(board: Board): boolean {
  throw new Error(`TODO: isFull(${board.length})`);
}

export function evaluate(board: Board, player: Player): number {
  throw new Error(`TODO: evaluate(${board.length}, ${player})`);
}

export function bestMove(board: Board, player: Player, depth: number): number {
  throw new Error(`TODO: bestMove(${board.length}, ${player}, ${depth})`);
}
