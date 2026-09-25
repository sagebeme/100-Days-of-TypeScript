import { describe, it, expect } from "vitest";
import {
  HOLES,
  createBao,
  facingHole,
  movesFor,
  legalMoves,
  innerRowEmpty,
  seedsOn,
  play,
  formatBoard,
  type BaoState,
  type Player,
  type Side,
} from "./starter/bao.ts";

// A side with the given holes filled and every other hole empty: side({ 0: 2, 7: 3 }).
function side(seeds: Record<number, number>): Side {
  const holes: Side = Array(HOLES).fill(0);
  for (const [hole, count] of Object.entries(seeds)) holes[Number(hole)] = count;
  return holes;
}

function state(mine: Side, theirs: Side, turn: Player = 0): BaoState {
  return { sides: turn === 0 ? [mine, theirs] : [theirs, mine], turn, winner: null };
}

// A healthy opponent: seeds in the inner row, and moves to play.
const opponent = () => side({ 0: 2, 1: 2 });

describe("createBao", () => {
  it("puts 2 seeds in all 32 holes, with player 0 to move", () => {
    const bao = createBao();
    expect(bao.sides).toEqual([Array(16).fill(2), Array(16).fill(2)]);
    expect(bao.turn).toBe(0);
    expect(bao.winner).toBeNull();
  });

  it("gives each side its own array", () => {
    const bao = createBao();
    bao.sides[0][0] = 99;
    expect(bao.sides[1][0]).toBe(2);
  });
});

describe("board helpers", () => {
  it("pairs each inner hole with the opponent hole facing it", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(facingHole)).toEqual([7, 6, 5, 4, 3, 2, 1, 0]);
  });

  it("says outer holes face nothing", () => {
    expect([8, 11, 15].map(facingHole)).toEqual([null, null, null]);
  });

  it("lists holes with 2 or more seeds as moves", () => {
    expect(movesFor(side({ 0: 1, 3: 2, 9: 5, 15: 1 }))).toEqual([3, 9]);
    expect(movesFor(side({ 2: 1 }))).toEqual([]);
  });

  it("gives the moves for whoever's turn it is, and none once the game is won", () => {
    expect(legalMoves(state(side({ 4: 2 }), side({ 6: 2 }), 0))).toEqual([4]);
    expect(legalMoves(state(side({ 4: 2 }), side({ 6: 2 }), 1))).toEqual([4]);
    expect(legalMoves({ ...state(side({ 4: 2 }), opponent()), winner: 1 })).toEqual([]);
  });

  it("checks the inner row and counts seeds", () => {
    expect(innerRowEmpty(side({ 8: 5, 15: 1 }))).toBe(true);
    expect(innerRowEmpty(side({ 7: 1 }))).toBe(false);
    expect(seedsOn(side({ 0: 2, 9: 5 }))).toBe(7);
  });
});

describe("play: sowing", () => {
  it("sows one seed per hole and stops in an empty hole", () => {
    const result = play(state(side({ 0: 2, 7: 2 }), opponent()), 0);
    expect(result.steps).toEqual([
      { kind: "lift", player: 0, hole: 0, seeds: 2 },
      { kind: "sow", player: 0, hole: 1 },
      { kind: "sow", player: 0, hole: 2 },
      { kind: "end", player: 0, hole: 2 },
    ]);
    expect(result.state.sides[0]).toEqual(side({ 1: 1, 2: 1, 7: 2 }));
  });

  it("goes round from hole 15 back to hole 0", () => {
    const result = play(state(side({ 15: 2, 7: 2 }), opponent()), 15);
    expect(result.state.sides[0]).toEqual(side({ 0: 1, 1: 1, 7: 2 }));
  });

  it("relays: landing in a full hole lifts it and sows on", () => {
    const result = play(state(side({ 0: 2, 2: 3, 7: 2 }), opponent()), 0);
    expect(result.steps).toEqual([
      { kind: "lift", player: 0, hole: 0, seeds: 2 },
      { kind: "sow", player: 0, hole: 1 },
      { kind: "sow", player: 0, hole: 2 },
      { kind: "lift", player: 0, hole: 2, seeds: 4 },
      { kind: "sow", player: 0, hole: 3 },
      { kind: "sow", player: 0, hole: 4 },
      { kind: "sow", player: 0, hole: 5 },
      { kind: "sow", player: 0, hole: 6 },
      { kind: "end", player: 0, hole: 6 },
    ]);
    expect(result.state.sides[0]).toEqual(side({ 1: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 2 }));
  });

  it("relays in the outer row too, but never captures from it", () => {
    const theirs = side({ 0: 5, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 5, 7: 5 });
    const result = play(state(side({ 0: 2, 9: 2, 11: 1 }), theirs), 9);
    expect(result.steps.map((s) => s.kind)).toEqual(["lift", "sow", "sow", "lift", "sow", "sow", "end"]);
    expect(result.state.sides[1]).toEqual(theirs);
    expect(result.state.sides[0]).toEqual(side({ 0: 2, 10: 1, 12: 1, 13: 1 }));
  });
});

describe("play: capturing", () => {
  it("moves the facing seeds into the hole you landed in, and ends the move", () => {
    const result = play(state(side({ 0: 2, 2: 1, 7: 2 }), side({ 5: 3, 1: 2, 9: 2 })), 0);
    expect(result.steps).toEqual([
      { kind: "lift", player: 0, hole: 0, seeds: 2 },
      { kind: "sow", player: 0, hole: 1 },
      { kind: "sow", player: 0, hole: 2 },
      { kind: "capture", player: 1, hole: 5, seeds: 3 },
      { kind: "end", player: 0, hole: 2 },
    ]);
    expect(result.state.sides[0]).toEqual(side({ 1: 1, 2: 5, 7: 2 }));
    expect(result.state.sides[1]).toEqual(side({ 1: 2, 9: 2 }));
  });

  it("can capture at the end of a relay", () => {
    // Lands on hole 2 (its facing hole 5 is empty, so relay), then on hole 4 (facing hole 3 has 4 seeds).
    const result = play(state(side({ 0: 2, 2: 1, 4: 1, 7: 2 }), side({ 0: 2, 1: 2, 3: 4 })), 0);
    expect(result.steps.map((s) => s.kind)).toEqual(["lift", "sow", "sow", "lift", "sow", "sow", "capture", "end"]);
    expect(result.steps[6]).toEqual({ kind: "capture", player: 1, hole: 3, seeds: 4 });
    expect(result.state.sides[0]).toEqual(side({ 1: 1, 3: 1, 4: 6, 7: 2 }));
    expect(result.state.sides[1]).toEqual(side({ 0: 2, 1: 2 }));
  });

  it("relays instead when the facing hole is empty", () => {
    const result = play(state(side({ 0: 2, 2: 1, 7: 2 }), side({ 1: 2, 9: 2 })), 0);
    expect(result.steps[3]).toEqual({ kind: "lift", player: 0, hole: 2, seeds: 2 });
  });

  it("works the same way for player 1", () => {
    const result = play(state(side({ 0: 2, 2: 1, 7: 2 }), side({ 5: 3, 1: 2, 9: 2 }), 1), 0);
    expect(result.steps[3]).toEqual({ kind: "capture", player: 0, hole: 5, seeds: 3 });
    expect(result.state.sides[1]).toEqual(side({ 1: 1, 2: 5, 7: 2 }));
    expect(result.state.sides[0]).toEqual(side({ 1: 2, 9: 2 }));
  });

  it("plays the opening move from the README", () => {
    const result = play(createBao(), 0);
    expect(result.steps).toEqual([
      { kind: "lift", player: 0, hole: 0, seeds: 2 },
      { kind: "sow", player: 0, hole: 1 },
      { kind: "sow", player: 0, hole: 2 },
      { kind: "capture", player: 1, hole: 5, seeds: 2 },
      { kind: "end", player: 0, hole: 2 },
    ]);
    expect(result.state.sides[0].slice(0, 3)).toEqual([0, 3, 5]);
  });
});

describe("play: turns and winning", () => {
  it("passes the turn to the other player", () => {
    const next = play(state(side({ 0: 2, 7: 2 }), opponent()), 0).state;
    expect(next.turn).toBe(1);
    expect(next.winner).toBeNull();
  });

  it("wins when a capture empties the opponent's inner row", () => {
    const next = play(state(side({ 0: 2, 2: 1, 7: 2 }), side({ 5: 3, 9: 2 })), 0).state;
    expect(next.winner).toBe(0);
    expect(legalMoves(next)).toEqual([]);
  });

  it("wins when the opponent has no hole with 2 seeds", () => {
    const next = play(state(side({ 0: 2, 7: 2 }), side({ 1: 1, 3: 1, 9: 1 })), 0).state;
    expect(next.winner).toBe(0);
  });

  it("loses when your own move empties your inner row", () => {
    const next = play(state(side({ 7: 2, 12: 2 }), opponent()), 7).state;
    expect(next.sides[0]).toEqual(side({ 8: 1, 9: 1, 12: 2 }));
    expect(next.winner).toBe(1);
  });
});

describe("play: rules it enforces", () => {
  it("rejects a hole with fewer than 2 seeds", () => {
    expect(() => play(state(side({ 0: 1, 7: 2 }), opponent()), 0)).toThrow("Pick a hole with at least 2 seeds");
  });

  it.each([16, -1, 1.5, NaN])("rejects hole %s", (hole) => {
    expect(() => play(createBao(), hole)).toThrow(`No such hole: ${hole}`);
  });

  it("rejects moves after the game is over", () => {
    expect(() => play({ ...createBao(), winner: 0 }, 0)).toThrow("The game is over");
  });

  it("never changes the state it was given", () => {
    const before = createBao();
    play(before, 3);
    expect(before).toEqual(createBao());
  });
});

describe("a whole game", () => {
  // A seeded random number generator, so this test plays the same games every run.
  function random(seed: number): () => number {
    return () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  }

  it.each([1, 2, 3, 4, 5])("keeps all 64 seeds and ends with a winner (game %i)", (seed) => {
    const pick = random(seed);
    let bao = createBao();
    let moves = 0;
    while (bao.winner === null && moves < 1000) {
      const options = legalMoves(bao);
      const mover = bao.turn;
      const result = play(bao, options[Math.floor(pick() * options.length)]);
      expect(seedsOn(result.state.sides[0]) + seedsOn(result.state.sides[1])).toBe(64);
      expect(result.steps.filter((s) => s.kind === "sow").every((s) => s.player === mover)).toBe(true);
      bao = result.state;
      moves++;
    }
    expect(bao.winner).not.toBeNull();
  });
});

describe("formatBoard", () => {
  it("draws player 0 at the bottom", () => {
    const board = state(side({ 0: 1, 8: 3, 15: 4 }), side({ 0: 5, 8: 6 }));
    expect(formatBoard(board)).toBe(
      [
        "  6  0  0  0  0  0  0  0",
        "  0  0  0  0  0  0  0  5",
        "------------------------",
        "  1  0  0  0  0  0  0  0",
        "  4  0  0  0  0  0  0  3",
      ].join("\n"),
    );
  });
});
