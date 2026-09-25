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

  // Build the 32 holes once, in two labelled halves. Drawing only updates them.
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

  let opponent: Opponent = isOpponent(opponentSelect.value) ? opponentSelect.value : "computer";
  let state = options.initial ?? createBao();
  let shown = copySides(state.sides);
  let lastEnd: HoleRef | null = null;
  let busy = false;
  let generation = 0;
  let pending: Promise<void> = Promise.resolve();

  function humanCanMove(): boolean {
    return !busy && state.winner === null && !(opponent === "computer" && state.turn === 1);
  }

  function drawDots(button: HTMLButtonElement, seeds: number): void {
    const dots = button.querySelector(".dots")!;
    const wanted = Math.min(seeds, MAX_DOTS);
    while (dots.children.length < wanted) dots.append(document.createElement("i"));
    while (dots.children.length > wanted) dots.lastElementChild!.remove();
  }

  function draw(highlight?: Highlight): void {
    const players = PLAYERS[opponent];
    const moves = humanCanMove() ? legalMoves(state) : [];

    for (const player of [0, 1] as const) {
      halves.get(player)!.setAttribute("aria-label", `${players[player].side} side`);
      buttons[player].forEach((button, hole) => {
        const seeds = shown[player][hole];
        const here = (ref: HoleRef | null | undefined) => ref?.player === player && ref.hole === hole;
        drawDots(button, seeds);
        button.querySelector(".count")!.textContent = String(seeds);
        button.setAttribute("aria-label", holeLabel(players[player], hole, seeds));
        button.disabled = !(player === state.turn && moves.includes(hole));
        button.classList.toggle("is-playable", !button.disabled);
        button.classList.toggle("is-active", here(highlight) && highlight?.kind !== "capture");
        button.classList.toggle("is-captured", here(highlight) && highlight?.kind === "capture");
        button.classList.toggle("is-last", !highlight && here(lastEnd));
      });

      const card = cards[player];
      card.querySelector(".player-name")!.textContent = players[player].name;
      card.querySelector(".player-seeds")!.textContent = String(seedsOn(shown[player]));
      card.classList.toggle("is-turn", state.winner === null && state.turn === player);
      card.classList.toggle("is-winner", state.winner === player);
    }
  }

  // Replays a move one step at a time. Returns false if a new game started meanwhile.
  async function animate(steps: Step[], game: number): Promise<boolean> {
    let lastSown = steps[0]?.hole ?? 0;
    for (const step of steps) {
      if (game !== generation) return false;
      switch (step.kind) {
        case "lift":
          shown[step.player][step.hole] = 0;
          break;
        case "sow":
          shown[step.player][step.hole] += 1;
          lastSown = step.hole;
          break;
        case "capture":
          shown[step.player][step.hole] = 0;
          shown[other(step.player)][lastSown] += step.seeds;
          break;
        case "end":
          lastEnd = { player: step.player, hole: step.hole };
          break;
      }
      draw(step);
      if (!options.reducedMotion && DELAYS[step.kind] > 0) {
        await options.wait(DELAYS[step.kind]);
      }
    }
    return game === generation;
  }

  async function move(hole: number): Promise<void> {
    const game = generation;
    const result = play(state, hole);
    busy = true;
    draw();

    if (!(await animate(result.steps, game))) return;

    state = result.state;
    shown = copySides(state.sides);
    busy = false;
    const players = PLAYERS[opponent];
    status.textContent = `${describeMove(result.steps, players)} ${turnText(state, players)}`;
    draw();

    if (opponent === "computer" && state.winner === null && state.turn === 1) {
      busy = true;
      draw();
      await options.wait(DELAYS.computer);
      if (game !== generation) return;
      busy = false;
      await move(chooseMove(state));
    }
  }

  function newGame(): void {
    generation += 1;
    state = options.initial ?? createBao();
    shown = copySides(state.sides);
    lastEnd = null;
    busy = false;
    status.textContent = `New game. ${turnText(state, PLAYERS[opponent])}`;
    draw();
  }

  board.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("button.hole") : null;
    if (button === null || button.disabled || !humanCanMove()) return;
    pending = move(Number(button.dataset.hole));
  });

  opponentSelect.addEventListener("change", () => {
    if (isOpponent(opponentSelect.value)) opponent = opponentSelect.value;
    newGame();
  });
  newGameButton.addEventListener("click", newGame);

  status.textContent = turnText(state, PLAYERS[opponent]);
  draw();

  return { settled: () => pending };
}
