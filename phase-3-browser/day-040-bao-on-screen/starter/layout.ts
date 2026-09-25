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
  // TODO: throw `No such hole: ${hole}` for anything that isn't a whole number from 0 to HOLES - 1
  // TODO: return the row and column from the table above
  throw new Error("not implemented yet");
}

export function holeAt(row: number, col: number): HoleRef {
  // TODO: throw `No hole at row ${row}, column ${col}` for a place off the board
  // TODO: the reverse of positionOf
  throw new Error("not implemented yet");
}
