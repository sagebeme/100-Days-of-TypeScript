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

// Part 1's app. Today it learns about crashing, scores and restarting: see the TODOs.
export function mountRiderRush(root: ParentNode, options: RiderRushOptions): () => void {
  const canvas = getElement(root, "#game", HTMLCanvasElement);
  const distanceLabel = getElement(root, "#distance", HTMLElement);
  const leftButton = getElement(root, "#left", HTMLButtonElement);
  const rightButton = getElement(root, "#right", HTMLButtonElement);
  // TODO: also find #score, #best, #message (HTMLElement) and #restart (HTMLButtonElement)

  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Canvas 2D is not supported here");
  }
  const pen: Pen = context;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  let state = createGame();
  // TODO: let best = loadBest(options.storage, BEST_KEY)
  let accumulator = 0;
  let lastTime: number | undefined;
  let frameId = 0;

  // TODO: crashed(): if the score beats best, save it and say "Crashed! New best: 12.",
  //       otherwise "Crashed! Score 7. Best 12." in #message. Show #restart and focus it.

  // TODO: restart(): a new game, accumulator back to 0, empty #message, hide #restart

  function frame(now: number): void {
    const frameSeconds = lastTime === undefined ? 0 : (now - lastTime) / 1000;
    lastTime = now;
    const loop = stepLoop(accumulator, frameSeconds);
    accumulator = loop.accumulator;
    for (let i = 0; i < loop.steps; i++) {
      state = update(state, FIXED_DT, options.random);
      // TODO: stop stepping once the game is over, and call crashed() exactly once when it happens
    }
    render(pen, state);
    distanceLabel.textContent = formatDistance(state.distance);
    // TODO: #score shows the score and #best shows the best
    frameId = options.requestFrame(frame);
  }

  function onKey(event: KeyboardEvent): void {
    if (event.key === "ArrowLeft" || event.key === "a") {
      event.preventDefault();
      state = steer(state, "left");
    } else if (event.key === "ArrowRight" || event.key === "d") {
      event.preventDefault();
      state = steer(state, "right");
    }
    // TODO: Space or Enter restarts, but only when the game is over
  }

  document.addEventListener("keydown", onKey);
  leftButton.addEventListener("pointerdown", () => {
    state = steer(state, "left");
  });
  rightButton.addEventListener("pointerdown", () => {
    state = steer(state, "right");
  });
  // TODO: clicking #restart restarts

  frameId = options.requestFrame(frame);

  return () => {
    options.cancelFrame(frameId);
    document.removeEventListener("keydown", onKey);
  };
}
