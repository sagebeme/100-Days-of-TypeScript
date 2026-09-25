import { getElement } from "./dom.ts";
import {
  WIDTH,
  HEIGHT,
  FIXED_DT,
  createGame,
  steer,
  update,
  stepLoop,
  formatDistance,
  loadBest,
  saveBest,
  render,
  type Pen,
} from "./game.ts";

export const BEST_KEY = "rider-rush-best";

export interface RiderRushOptions {
  random: () => number;
  requestFrame: (callback: (now: number) => void) => number;
  cancelFrame: (id: number) => void;
  storage: Pick<Storage, "getItem" | "setItem">;
}

// Returns stop(), which ends the loop and removes the key listener.
export function mountRiderRush(root: ParentNode, options: RiderRushOptions): () => void {
  const canvas = getElement(root, "#game", HTMLCanvasElement);
  const distanceLabel = getElement(root, "#distance", HTMLElement);
  const scoreLabel = getElement(root, "#score", HTMLElement);
  const bestLabel = getElement(root, "#best", HTMLElement);
  const message = getElement(root, "#message", HTMLElement);
  const leftButton = getElement(root, "#left", HTMLButtonElement);
  const rightButton = getElement(root, "#right", HTMLButtonElement);
  const restartButton = getElement(root, "#restart", HTMLButtonElement);

  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Canvas 2D is not supported here");
  }
  const pen: Pen = context;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  let state = createGame();
  let best = loadBest(options.storage, BEST_KEY);
  let accumulator = 0;
  let lastTime: number | undefined;
  let frameId = 0;

  function crashed(): void {
    const newBest = state.score > best;
    if (newBest) {
      best = state.score;
      saveBest(options.storage, BEST_KEY, best);
    }
    message.textContent = newBest
      ? `Crashed! New best: ${state.score}.`
      : `Crashed! Score ${state.score}. Best ${best}.`;
    restartButton.hidden = false;
    restartButton.focus();
  }

  function restart(): void {
    state = createGame();
    accumulator = 0;
    message.textContent = "";
    restartButton.hidden = true;
  }

  function frame(now: number): void {
    const frameSeconds = lastTime === undefined ? 0 : (now - lastTime) / 1000;
    lastTime = now;
    const loop = stepLoop(accumulator, frameSeconds);
    accumulator = loop.accumulator;
    for (let i = 0; i < loop.steps && state.status === "running"; i++) {
      state = update(state, FIXED_DT, options.random);
      if (state.status === "over") crashed();
    }
    render(pen, state);
    distanceLabel.textContent = formatDistance(state.distance);
    scoreLabel.textContent = String(state.score);
    bestLabel.textContent = String(best);
    frameId = options.requestFrame(frame);
  }

  function onKey(event: KeyboardEvent): void {
    if (event.key === "ArrowLeft" || event.key === "a") {
      event.preventDefault();
      state = steer(state, "left");
    } else if (event.key === "ArrowRight" || event.key === "d") {
      event.preventDefault();
      state = steer(state, "right");
    } else if ((event.key === " " || event.key === "Enter") && state.status === "over") {
      event.preventDefault();
      restart();
    }
  }

  document.addEventListener("keydown", onKey);
  leftButton.addEventListener("pointerdown", () => {
    state = steer(state, "left");
  });
  rightButton.addEventListener("pointerdown", () => {
    state = steer(state, "right");
  });
  restartButton.addEventListener("click", restart);

  frameId = options.requestFrame(frame);

  return () => {
    options.cancelFrame(frameId);
    document.removeEventListener("keydown", onKey);
  };
}
