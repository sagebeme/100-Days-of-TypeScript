import { HOLES, INNER_HOLES, type Player } from "./bao.ts";

export const ROWS = 4;
export const COLUMNS = 8;

export interface Position {
  row: number; // 0 at the top of the screen
  col: number; // 0 on the left
}

export interface HoleRef {
  player: Player;
  hole: number;
}

// Where a hole sits on screen. Player 1 is at the top, player 0 at the bottom:
//   row 0: player 1 outer   holes  8 .. 15, left to right
//   row 1: player 1 inner   holes  7 .. 0,  left to right
//   row 2: player 0 inner   holes  0 .. 7,  left to right
//   row 3: player 0 outer   holes 15 .. 8,  left to right
export function positionOf(player: Player, hole: number): Position {
  if (!Number.isInteger(hole) || hole < 0 || hole >= HOLES) {
    throw new Error(`No such hole: ${hole}`);
  }
  const inner = hole < INNER_HOLES;
  if (player === 0) {
    return inner ? { row: 2, col: hole } : { row: 3, col: HOLES - 1 - hole };
  }
  return inner ? { row: 1, col: INNER_HOLES - 1 - hole } : { row: 0, col: hole - INNER_HOLES };
}

export function holeAt(row: number, col: number): HoleRef {
  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row >= ROWS || col < 0 || col >= COLUMNS) {
    throw new Error(`No hole at row ${row}, column ${col}`);
  }
  switch (row) {
    case 0:
      return { player: 1, hole: col + INNER_HOLES };
    case 1:
      return { player: 1, hole: INNER_HOLES - 1 - col };
    case 2:
      return { player: 0, hole: col };
    default:
      return { player: 0, hole: HOLES - 1 - col };
  }
}
