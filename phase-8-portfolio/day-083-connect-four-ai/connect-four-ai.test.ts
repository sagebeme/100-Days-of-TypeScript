import { describe, it, expect } from "vitest";
import { emptyBoard, drop, landingRow, validMoves, winner, isFull, bestMove, evaluate, parseBoard, other, LEVELS, ROWS, COLS, type Board } from "./starter/game.ts";

const board = (...rows: string[]) => parseBoard(rows);

describe("the rules", () => {
  it("has a 6 by 7 board, empty at the start", () => {
    const b = emptyBoard();
    expect([ROWS, COLS, b.length, b[0].length]).toEqual([6, 7, 6, 7]);
    expect(validMoves(b)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(other(1)).toBe(2);
  });

  it("drops discs to the lowest free row, without changing the old board", () => {
    const start = emptyBoard();
    const one = drop(start, 3, 1);
    const two = drop(one, 3, 2);
    expect(two[5][3]).toBe(1);
    expect(two[4][3]).toBe(2);
    expect(start[5][3]).toBe(0);
    expect(landingRow(two, 3)).toBe(3);
  });

  it("refuses a full column and a column that isn't there", () => {
    let b = emptyBoard();
    for (let i = 0; i < 6; i++) b = drop(b, 0, i % 2 ? 2 : 1);
    expect(landingRow(b, 0)).toBe(-1);
    expect(validMoves(b)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(() => drop(b, 0, 1)).toThrow(/full/);
    expect(() => drop(b, 7, 1)).toThrow(/no column/);
  });

  it("finds four in a row in every direction, and says where", () => {
    expect(winner(board(".......", ".......", ".......", ".......", ".......", ".XXXX.."))).toEqual({ player: 1, cells: [[5, 1], [5, 2], [5, 3], [5, 4]] });
    expect(winner(board(".......", ".......", "O......", "O......", "O......", "O......"))?.player).toBe(2);
    expect(winner(board(".......", ".......", "...X...", "..X....", ".X.....", "X......"))?.cells).toEqual([[2, 3], [3, 2], [4, 1], [5, 0]]);
    expect(winner(board("O......", ".O.....", "..O....", "...O...", ".......", "......."))?.player).toBe(2);
    expect(winner(board(".......", ".......", ".......", ".......", ".......", "XXX.XXX"))).toBeNull();
  });

  it("knows when the board is full", () => {
    const full = board("XOXOXOX", "XOXOXOX", "OXOXOXO", "OXOXOXO", "XOXOXOX", "XOXOXOX");
    expect(isFull(full)).toBe(true);
    expect(winner(full)).toBeNull();
  });
});

describe("the computer", () => {
  it("takes a win when it has one", () => {
    const b = board(".......", ".......", ".......", "O......", "O......", "OXX.X..");
    expect(bestMove(b, 2, 1)).toBe(0); // the fourth O on top of the column
  });

  it("blocks your win", () => {
    const b = board(".......", ".......", ".......", ".......", ".......", "OXXX...");
    expect(bestMove(b, 2, 2)).toBe(4);
    const vertical = board(".......", ".......", ".......", "...X...", "...X...", "..OXO..");
    expect(bestMove(vertical, 2, 2)).toBe(3);
  });

  it("prefers winning now to blocking", () => {
    const b = board(".......", ".......", ".......", ".......", "OOO....", "XXX....");
    expect(bestMove(b, 2, 3)).toBe(3);
  });

  it("doesn't play a move that lets you win straight away", () => {
    // Playing in column 5 would put an O where X could then land on top and win across row 4.
    const b = board(".......", ".......", ".......", "..XXX..", "..OOX..", ".XOOXO.");
    const move = bestMove(b, 2, 4);
    const after = drop(b, move, 2);
    for (const reply of validMoves(after)) expect(winner(drop(after, reply, 1))?.player).not.toBe(1);
  });

  it("opens in the centre, and thinks deeper on harder levels", () => {
    expect(bestMove(emptyBoard(), 1, LEVELS.medium)).toBe(3);
    expect(LEVELS).toEqual({ easy: 1, medium: 3, hard: 6 });
  });

  it("thinks ahead fast enough to play at the hardest level", () => {
    const started = performance.now();
    bestMove(drop(emptyBoard(), 3, 1), 2, LEVELS.hard);
    expect(performance.now() - started).toBeLessThan(2000);
  });

  it("scores a position from a player's point of view", () => {
    const b = board(".......", ".......", ".......", ".......", ".......", "..XXX..");
    expect(evaluate(b, 1)).toBeGreaterThan(0);
    expect(evaluate(b, 2)).toBeLessThan(0);
    expect(evaluate(emptyBoard(), 1)).toBe(0);
  });
});

describe("parseBoard", () => {
  it("reads rows of text, and refuses the wrong size", () => {
    const b: Board = parseBoard([".......", ".......", ".......", ".......", ".......", "X.....O"]);
    expect(b[5][0]).toBe(1);
    expect(b[5][6]).toBe(2);
    expect(() => parseBoard(["..."])).toThrow();
  });
});
