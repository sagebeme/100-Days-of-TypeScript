import { getElement } from "./dom.ts";
import { WIDTH, HEIGHT, FIXED_DT, createGame, steer, update, stepLoop, formatDistance, render, type Pen } from "./game.ts";

export interface RiderRushOptions {
  random: () => number;
  requestFrame: (callback: (now: number) => void) => number;
  cancelFrame: (id: number) => void;
}

// Returns stop(), which ends the loop and removes the key listener.
export function mountRiderRush(root: ParentNode, options: RiderRushOptions): () => void {
  const canvas = getElement(root, "#game", HTMLCanvasElement);
  const distanceLabel = getElement(root, "#distance", HTMLElement);
  const leftButton = getElement(root, "#left", HTMLButtonElement);
  const rightButton = getElement(root, "#right", HTMLButtonElement);

  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Canvas 2D is not supported here");
  }
  const pen: Pen = context;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  let state = createGame();
  let accumulator = 0;
  let lastTime: number | undefined;
  let frameId = 0;

  function frame(now: number): void {
    const frameSeconds = lastTime === undefined ? 0 : (now - lastTime) / 1000;
    lastTime = now;
    const loop = stepLoop(accumulator, frameSeconds);
    accumulator = loop.accumulator;
    for (let i = 0; i < loop.steps; i++) {
      state = update(state, FIXED_DT, options.random);
    }
    render(pen, state);
    distanceLabel.textContent = formatDistance(state.distance);
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
  }

  document.addEventListener("keydown", onKey);
  leftButton.addEventListener("pointerdown", () => {
    state = steer(state, "left");
  });
  rightButton.addEventListener("pointerdown", () => {
    state = steer(state, "right");
  });

  frameId = options.requestFrame(frame);

  return () => {
    options.cancelFrame(frameId);
    document.removeEventListener("keydown", onKey);
  };
}
