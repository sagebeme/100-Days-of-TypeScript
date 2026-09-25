import { getElement } from "./dom.ts";
import { createGrid, paint, cellFromPoint, floodFill, toSvg, type Grid } from "./grid.ts";

export interface PixelArtOptions {
  size: number;
  cellSize: number;
}

export function mountPixelArt(root: ParentNode, options: PixelArtOptions): void {
  // TODO: find #board, #color (HTMLInputElement), #tool (HTMLSelectElement),
  //       #undo, #clear, #export (HTMLButtonElement) and #svg (HTMLTextAreaElement)
  // TODO: let grid = createGrid(size); const history: Grid[] = []
  // TODO: set the board's gridTemplateColumns to `repeat(${size}, minmax(0, 1fr))` and its width to
  //       `min(100%, ${size * cellSize}px)` (it shrinks on a phone), then add size * size <div class="cell">

  // TODO: render(): for every cell, style.background = colour (or "transparent") and dataset.color = colour

  // TODO: applyTool(event): turn clientX/clientY (minus the board's getBoundingClientRect) into a cell.
  //       Measure the cell size on screen, rect.width / size, because the board may have shrunk
  //       (fall back to cellSize if rect.width is 0),
  //       then pen -> paint(#color), eraser -> paint(""), fill -> floodFill(#color), and render()

  // TODO: pointerdown: remember the grid for undo, setPointerCapture, start a stroke, applyTool
  // TODO: pointermove: applyTool while a pen/eraser stroke is going
  // TODO: pointerup / pointercancel: end the stroke; if the grid didn't change, drop that undo entry
  // TODO: #undo, #clear (undoable), #export (toSvg into #svg)
  // TODO: render() once now
  throw new Error("not implemented yet");
}
