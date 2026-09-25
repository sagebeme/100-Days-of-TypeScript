// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createBao, play, HOLES, type BaoState, type Player, type Side } from "./starter/bao.ts";
import { positionOf, holeAt, ROWS, COLUMNS } from "./starter/layout.ts";
import { chooseMove } from "./starter/ai.ts";
import { PLAYERS, isOpponent, holeLabel, describeMove, turnText } from "./starter/text.ts";
import { mountBao, DELAYS, MAX_DOTS } from "./starter/app.ts";

const html = readFileSync(join(import.meta.dirname, "starter", "index.html"), "utf8");
const you = PLAYERS.computer[0];
const computer = PLAYERS.computer[1];

function side(seeds: Record<number, number>): Side {
  const holes: Side = Array(HOLES).fill(0);
  for (const [hole, count] of Object.entries(seeds)) holes[Number(hole)] = count;
  return holes;
}

function state(bottom: Side, top: Side, turn: Player = 0): BaoState {
  return { sides: [bottom, top], turn, winner: null };
}

describe("layout", () => {
  it("places each player's inner row next to the middle of the board", () => {
    expect(positionOf(0, 0)).toEqual({ row: 2, col: 0 });
    expect(positionOf(0, 7)).toEqual({ row: 2, col: 7 });
    expect(positionOf(1, 0)).toEqual({ row: 1, col: 7 });
    expect(positionOf(1, 7)).toEqual({ row: 1, col: 0 });
  });

  it("places the outer rows at the edges, running the other way", () => {
    expect(positionOf(0, 8)).toEqual({ row: 3, col: 7 });
    expect(positionOf(0, 15)).toEqual({ row: 3, col: 0 });
    expect(positionOf(1, 8)).toEqual({ row: 0, col: 0 });
    expect(positionOf(1, 15)).toEqual({ row: 0, col: 7 });
  });

  it("puts facing holes in the same column", () => {
    for (let hole = 0; hole < 8; hole++) {
      expect(positionOf(0, hole).col).toBe(positionOf(1, 7 - hole).col);
    }
  });

  it("maps every position back to its hole", () => {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLUMNS; col++) {
        const { player, hole } = holeAt(row, col);
        expect(positionOf(player, hole)).toEqual({ row, col });
      }
    }
  });

  it("rejects places that aren't on the board", () => {
    expect(() => holeAt(4, 0)).toThrow("No hole at row 4, column 0");
    expect(() => holeAt(0, -1)).toThrow("No hole at row 0, column -1");
    expect(() => positionOf(0, 16)).toThrow("No such hole: 16");
  });
});

describe("chooseMove", () => {
  it("takes a winning move when there is one", () => {
    // Hole 0 captures the opponent's last inner seeds and wins; hole 9 captures nothing.
    const position = state(side({ 0: 2, 2: 1, 7: 2, 9: 2 }), side({ 5: 3, 9: 2 }));
    expect(chooseMove(position)).toBe(0);
  });

  it("otherwise captures as many seeds as it can", () => {
    // Hole 0 captures 3 (from hole 5). Hole 3 lands on hole 5, facing hole 2, and captures 6.
    const position = state(side({ 0: 2, 2: 1, 3: 2, 5: 1, 12: 2 }), side({ 2: 6, 5: 3, 10: 2 }));
    expect(chooseMove(position)).toBe(3);
  });

  it("picks the lowest hole when nothing is better", () => {
    const position = state(side({ 4: 2, 10: 2 }), side({ 0: 2, 1: 2 }));
    expect(chooseMove(position)).toBe(4);
  });

  it("plays for whoever's turn it is", () => {
    const move = chooseMove(play(createBao(), 0).state);
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThan(16);
  });

  it("throws when there are no moves", () => {
    expect(() => chooseMove({ ...createBao(), winner: 0 })).toThrow("No moves to choose from");
  });
});

describe("text", () => {
  it("recognises the two opponents", () => {
    expect(isOpponent("computer")).toBe(true);
    expect(isOpponent("friend")).toBe(true);
    expect(isOpponent("robot")).toBe(false);
  });

  it("labels holes for screen readers", () => {
    expect(holeLabel(you, 3, 4)).toBe("Your inner row, hole 3: 4 seeds");
    expect(holeLabel(computer, 12, 1)).toBe("Computer's outer row, hole 12: 1 seed");
    expect(holeLabel(PLAYERS.friend[1], 0, 0)).toBe("Player 2's inner row, hole 0: 0 seeds");
  });

  it("describes a move", () => {
    expect(describeMove(play(createBao(), 0).steps, PLAYERS.computer)).toBe(
      "You sowed from hole 0 and captured 2 seeds.",
    );
    const quiet = play(state(side({ 0: 2, 7: 2 }), side({ 0: 2, 1: 2 }), 1), 0).steps;
    expect(describeMove(quiet, PLAYERS.computer)).toBe("Computer sowed from hole 0.");
  });

  it("says whose turn it is, or who won", () => {
    expect(turnText(createBao(), PLAYERS.computer)).toBe("Your turn.");
    expect(turnText({ ...createBao(), turn: 1 }, PLAYERS.friend)).toBe("Player 2's turn.");
    expect(turnText({ ...createBao(), winner: 0 }, PLAYERS.computer)).toBe("You win! Umeshinda!");
  });
});

describe("mountBao", () => {
  const noWait = () => Promise.resolve();

  beforeEach(() => {
    document.body.innerHTML = new DOMParser().parseFromString(html, "text/html").body.innerHTML;
  });

  const hole = (player: Player, index: number) =>
    document.querySelector<HTMLButtonElement>(`.hole[data-player="${player}"][data-hole="${index}"]`)!;
  const count = (player: Player, index: number) => Number(hole(player, index).querySelector(".count")?.textContent);
  const status = () => document.querySelector("#status")?.textContent;
  const card = (player: Player) => document.querySelector<HTMLElement>(`#player-${player}`)!;

  function expectBoard(expected: BaoState): void {
    for (const player of [0, 1] as const) {
      for (let index = 0; index < HOLES; index++) {
        expect(count(player, index), `player ${player} hole ${index}`).toBe(expected.sides[player][index]);
      }
    }
  }

  it("draws 32 holes in two labelled halves, in board order", () => {
    mountBao(document, { wait: noWait, reducedMotion: true });
    const halves = document.querySelectorAll("#board .board-half");
    expect(halves).toHaveLength(2);
    expect(halves[0].getAttribute("aria-label")).toBe("Computer's side");
    expect(halves[1].getAttribute("aria-label")).toBe("Your side");

    const order = [...document.querySelectorAll<HTMLElement>("#board .hole")].map(
      (b) => `${b.dataset.player}:${b.dataset.hole}`,
    );
    const expected: string[] = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLUMNS; col++) {
        const ref = holeAt(row, col);
        expected.push(`${ref.player}:${ref.hole}`);
      }
    }
    expect(order).toEqual(expected);
  });

  it("shows the starting position", () => {
    mountBao(document, { wait: noWait, reducedMotion: true });
    expectBoard(createBao());
    expect(hole(0, 3).querySelectorAll(".dots i")).toHaveLength(2);
    expect(hole(0, 3).getAttribute("aria-label")).toBe("Your inner row, hole 3: 2 seeds");
    expect(status()).toBe("Your turn.");
    expect(card(0).classList.contains("is-turn")).toBe(true);
    expect(card(1).querySelector(".player-seeds")?.textContent).toBe("32");
  });

  it("lets you play only your own holes with 2 or more seeds", () => {
    mountBao(document, {
      wait: noWait,
      reducedMotion: true,
      initial: state(side({ 0: 1, 3: 2, 7: 2 }), side({ 0: 2, 1: 2 })),
    });
    expect(hole(0, 3).disabled).toBe(false);
    expect(hole(0, 3).classList.contains("is-playable")).toBe(true);
    expect(hole(0, 0).disabled).toBe(true);
    expect(hole(1, 0).disabled).toBe(true);
  });

  it("plays your move, then the computer's reply", async () => {
    const game = mountBao(document, { wait: noWait, reducedMotion: true });
    hole(0, 0).click();
    await game.settled();

    const afterYou = play(createBao(), 0).state;
    const reply = chooseMove(afterYou);
    const afterComputer = play(afterYou, reply);
    expectBoard(afterComputer.state);
    expect(status()).toBe(`${describeMove(afterComputer.steps, PLAYERS.computer)} Your turn.`);
    expect(card(0).querySelector(".player-seeds")?.textContent).toBe(
      String(afterComputer.state.sides[0].reduce((a, b) => a + b, 0)),
    );
  });

  it("marks where the last move ended", async () => {
    const game = mountBao(document, { wait: noWait, reducedMotion: true });
    hole(0, 0).click();
    await game.settled();
    expect(document.querySelectorAll(".hole.is-last")).toHaveLength(1);
  });

  it("replays the move seed by seed, highlighting each hole", async () => {
    const frames: { hole0: number; hole1: number; active: string[] }[] = [];
    const wait = vi.fn(async () => {
      frames.push({
        hole0: count(0, 0),
        hole1: count(0, 1),
        active: [...document.querySelectorAll<HTMLElement>(".hole.is-active")].map((b) => b.dataset.hole!),
      });
    });
    const game = mountBao(document, {
      wait,
      reducedMotion: false,
      initial: state(side({ 0: 2, 7: 2 }), side({ 0: 2, 1: 2 })),
    });
    hole(0, 0).click();
    await game.settled();

    expect(frames[0]).toEqual({ hole0: 0, hole1: 0, active: ["0"] }); // lifted
    expect(frames[1]).toEqual({ hole0: 0, hole1: 1, active: ["1"] }); // first seed sown
    expect(wait).toHaveBeenNthCalledWith(1, DELAYS.lift);
    expect(wait).toHaveBeenNthCalledWith(2, DELAYS.sow);
  });

  it("shows a capture moving the seeds across", async () => {
    const captured: number[] = [];
    const wait = async () => {
      if (document.querySelector(".hole.is-captured")) captured.push(count(1, 5), count(0, 2));
    };
    const game = mountBao(document, {
      wait,
      reducedMotion: false,
      initial: state(side({ 0: 2, 2: 1, 7: 2 }), side({ 5: 3, 1: 2, 9: 2 })),
    });
    hole(0, 0).click();
    await game.settled();
    expect(captured.slice(0, 2)).toEqual([0, 5]);
  });

  it("with reduced motion, only waits for the computer to 'think'", async () => {
    const wait = vi.fn(noWait);
    const game = mountBao(document, { wait, reducedMotion: true });
    hole(0, 0).click();
    await game.settled();
    expect(wait.mock.calls).toEqual([[DELAYS.computer]]);
  });

  it("ignores clicks while a move is playing", async () => {
    // The move pauses on its first wait until the test lets it go.
    let paused = true;
    let release: () => void = () => {};
    const wait = () => (paused ? new Promise<void>((resolve) => (release = resolve)) : Promise.resolve());
    const game = mountBao(document, { wait, reducedMotion: false });

    hole(0, 0).click();
    expect(document.querySelectorAll(".hole:not(:disabled)")).toHaveLength(0);
    hole(0, 3).click(); // a second move would lift hole 3 straight away
    expect(count(0, 3)).toBe(2);

    paused = false;
    release();
    await game.settled();
    expect(status()).toMatch(/^Computer sowed/);
  });

  it("plays two people on one device", async () => {
    document.querySelector<HTMLSelectElement>("#opponent")!.value = "friend";
    document.querySelector("#opponent")!.dispatchEvent(new Event("change"));
    const game = mountBao(document, { wait: noWait, reducedMotion: true });
    expect(card(0).querySelector(".player-name")?.textContent).toBe("Player 1");

    hole(0, 0).click();
    await game.settled();
    expectBoard(play(createBao(), 0).state);
    expect(status()).toBe("Player 1 sowed from hole 0 and captured 2 seeds. Player 2's turn.");
    expect(hole(1, 0).disabled).toBe(false);
    expect(hole(0, 3).disabled).toBe(true);
  });

  it("announces the winner and locks the board", async () => {
    const game = mountBao(document, {
      wait: noWait,
      reducedMotion: true,
      initial: state(side({ 0: 2, 2: 1, 7: 2 }), side({ 5: 3, 9: 2 })),
    });
    hole(0, 0).click();
    await game.settled();
    expect(status()).toBe("You sowed from hole 0 and captured 3 seeds. You win! Umeshinda!");
    expect(document.querySelectorAll(".hole:not(:disabled)")).toHaveLength(0);
    expect(card(0).classList.contains("is-winner")).toBe(true);
    expect(card(0).classList.contains("is-turn")).toBe(false);
  });

  it("starts a new game", async () => {
    const game = mountBao(document, { wait: noWait, reducedMotion: true });
    hole(0, 0).click();
    await game.settled();
    document.querySelector<HTMLButtonElement>("#new-game")!.click();
    expectBoard(createBao());
    expect(status()).toBe("New game. Your turn.");
    expect(document.querySelectorAll(".hole.is-last")).toHaveLength(0);
  });

  it("switching opponent starts a new game with the new names", () => {
    mountBao(document, { wait: noWait, reducedMotion: true });
    const select = document.querySelector<HTMLSelectElement>("#opponent")!;
    select.value = "friend";
    select.dispatchEvent(new Event("change"));
    expect(status()).toBe("New game. Player 1's turn.");
    expect(card(1).querySelector(".player-name")?.textContent).toBe("Player 2");
    expect(hole(0, 3).getAttribute("aria-label")).toBe("Player 1's inner row, hole 3: 2 seeds");
  });

  it(`draws at most ${MAX_DOTS} seed dots, and the number for the rest`, () => {
    mountBao(document, { wait: noWait, reducedMotion: true, initial: state(side({ 0: 20, 7: 2 }), side({ 0: 2 })) });
    expect(hole(0, 0).querySelectorAll(".dots i")).toHaveLength(MAX_DOTS);
    expect(count(0, 0)).toBe(20);
  });
});
