import { getElement } from "./dom.ts";
import { createBao, play, legalMoves, seedsOn, other, type BaoState, type Player, type Side, type Step } from "./bao.ts";
import { holeAt, ROWS, COLUMNS, type HoleRef } from "./layout.ts";
import { chooseMove } from "./ai.ts";
import { PLAYERS, isOpponent, holeLabel, describeMove, turnText, type Opponent } from "./text.ts";

// How long each kind of step stays on screen, in milliseconds.
export const DELAYS: Record<Step["kind"] | "computer", number> = {
  lift: 260,
  sow: 140,
  capture: 480,
  end: 0,
  computer: 650,
};

// Seed dots drawn in a hole. Past this, the number on the hole tells the rest.
export const MAX_DOTS = 12;

export interface BaoOptions {
  wait: (ms: number) => Promise<void>;
  reducedMotion: boolean;
  initial?: BaoState;
}

export interface BaoGame {
  // Resolves when the latest move (and any computer reply) has finished playing.
  settled(): Promise<void>;
}

type Highlight = HoleRef & { kind: Step["kind"] };

const copySides = (sides: [Side, Side]): [Side, Side] => [[...sides[0]], [...sides[1]]];

export function mountBao(root: ParentNode, options: BaoOptions): BaoGame {
  const board = getElement(root, "#board", HTMLElement);
  const status = getElement(root, "#status", HTMLElement);
  const opponentSelect = getElement(root, "#opponent", HTMLSelectElement);
  const newGameButton = getElement(root, "#new-game", HTMLButtonElement);
  const cards = [getElement(root, "#player-0", HTMLElement), getElement(root, "#player-1", HTMLElement)];

  // Already written: build the 32 holes once, in two labelled halves. Drawing only updates them.
  // Each hole is <button class="hole" data-player data-hole><span class="dots"/><span class="count"/></button>
  const buttons: [HTMLButtonElement[], HTMLButtonElement[]] = [[], []];
  const halves = new Map<Player, HTMLElement>();
  for (const player of [1, 0] as const) {
    const half = document.createElement("div");
    half.className = "board-half";
    half.dataset.player = String(player);
    half.setAttribute("role", "group");
    halves.set(player, half);
  }
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLUMNS; col++) {
      const { player, hole } = holeAt(row, col);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "hole";
      button.dataset.player = String(player);
      button.dataset.hole = String(hole);
      const dots = document.createElement("span");
      dots.className = "dots";
      dots.setAttribute("aria-hidden", "true");
      const count = document.createElement("span");
      count.className = "count";
      count.setAttribute("aria-hidden", "true");
      button.append(dots, count);
      buttons[player][hole] = button;
      halves.get(player)!.append(button);
    }
  }
  board.replaceChildren(halves.get(1)!, halves.get(0)!);

  // Already written: keeps a hole's <i> seed dots in step with its count, up to MAX_DOTS.
  function drawDots(button: HTMLButtonElement, seeds: number): void {
    const dots = button.querySelector(".dots")!;
    const wanted = Math.min(seeds, MAX_DOTS);
    while (dots.children.length < wanted) dots.append(document.createElement("i"));
    while (dots.children.length > wanted) dots.lastElementChild!.remove();
  }

  // TODO: the game's variables:
  //   opponent (from #opponent), state (options.initial or a new game),
  //   shown (a copy of the sides: what's on screen while a move is replaying),
  //   lastEnd (where the last move ended), busy, generation (goes up on every new game),
  //   pending (the promise settled() returns)

  // TODO: humanCanMove(): not busy, no winner, and not the computer's turn

  // TODO: draw(highlight?): for every hole: dots, .count, aria-label (holeLabel), disabled unless it's
  //   a legal move for the player to move (and humanCanMove), and the classes
  //   is-playable / is-active / is-captured / is-last. Each half's aria-label is "Your side" etc.
  //   Each card: .player-name, .player-seeds, and is-turn / is-winner.

  // TODO: async animate(steps, game): apply each step to `shown`, draw(step), then wait DELAYS[kind]
  //   (skip the wait with reduced motion, or when the delay is 0). A capture moves its seeds into the
  //   hole the last seed was sown in. Stop early and return false if `generation` changed.

  // TODO: async move(hole): play it, busy while animating, then save the new state, write
  //   "<describeMove> <turnText>" to #status and draw. If it's now the computer's turn, wait
  //   DELAYS.computer and play chooseMove(state) the same way.

  // TODO: newGame(): generation + 1, fresh state, status "New game. Your turn.", draw

  // TODO: clicks on a playable hole (one listener on #board), #opponent change, #new-game click
  // TODO: first status and draw, then return { settled: () => pending }
  throw new Error("not implemented yet");
}
