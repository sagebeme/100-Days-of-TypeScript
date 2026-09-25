import { getElement } from "./dom.ts";
import { renderPrint, type Pen } from "./pattern.ts";
import { PALETTES } from "./palettes.ts";

export interface KitengeOptions {
  width: number;
  height: number;
  tile: number;
  seed: number;
}

export function mountKitenge(root: ParentNode, options: KitengeOptions): void {
  // TODO: find #print (HTMLCanvasElement), #new (HTMLButtonElement), #palette (HTMLSelectElement), #seed (HTMLElement)
  // TODO: const context = canvas.getContext("2d"); if it's null throw "Canvas 2D is not supported here"
  // TODO: const pen: Pen = context (a new const, so draw() below knows it isn't null)
  // TODO: set canvas.width and canvas.height
  // TODO: let seed = options.seed

  // TODO: draw(): look up PALETTES[palette.value], renderPrint(...), and #seed = "Print #42"

  // TODO: #new click -> seed + 1, draw; #palette change -> draw
  // TODO: draw once now
  throw new Error("not implemented yet");
}
