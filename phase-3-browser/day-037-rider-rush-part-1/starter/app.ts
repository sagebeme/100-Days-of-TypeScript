import { getElement } from "./dom.ts";
import { WIDTH, HEIGHT, FIXED_DT, createGame, steer, update, stepLoop, formatDistance, render, type Pen } from "./game.ts";

export interface RiderRushOptions {
  random: () => number;
  requestFrame: (callback: (now: number) => void) => number;
  cancelFrame: (id: number) => void;
}

// Returns stop(), which ends the loop and removes the key listener.
export function mountRiderRush(root: ParentNode, options: RiderRushOptions): () => void {
  // TODO: find #game (HTMLCanvasElement), #distance (HTMLElement), #left and #right (HTMLButtonElement)
  // TODO: get the 2D context (throw "Canvas 2D is not supported here" if null), const pen: Pen = context
  // TODO: canvas.width = WIDTH, canvas.height = HEIGHT

  // TODO: let state = createGame(), accumulator = 0, lastTime: number | undefined, frameId

  // TODO: frame(now): seconds since lastTime (0 the first time), stepLoop, run update() `steps` times
  //       with FIXED_DT, render, #distance = formatDistance(...), then frameId = options.requestFrame(frame)

  // TODO: keydown on document: ArrowLeft / a -> left, ArrowRight / d -> right (preventDefault for those)
  // TODO: pointerdown on #left / #right steers too

  // TODO: start the loop, and return stop(): cancelFrame + remove the keydown listener
  throw new Error("not implemented yet");
}
