import { getElement } from "./dom.ts";
import { createGrid, paint, cellFromPoint, floodFill, toSvg, type Grid } from "./grid.ts";

export interface PixelArtOptions {
  size: number;
  cellSize: number;
}

export function mountPixelArt(root: ParentNode, options: PixelArtOptions): void {
  const { size, cellSize } = options;
  const board = getElement(root, "#board", HTMLElement);
  const colorInput = getElement(root, "#color", HTMLInputElement);
  const toolSelect = getElement(root, "#tool", HTMLSelectElement);
  const undoButton = getElement(root, "#undo", HTMLButtonElement);
  const clearButton = getElement(root, "#clear", HTMLButtonElement);
  const exportButton = getElement(root, "#export", HTMLButtonElement);
  const svgOutput = getElement(root, "#svg", HTMLTextAreaElement);

  let grid = createGrid(size);
  const history: Grid[] = [];
  let strokeStart: Grid | null = null;

  board.style.gridTemplateColumns = `repeat(${size}, ${cellSize}px)`;
  const cells: HTMLDivElement[] = [];
  for (let i = 0; i < size * size; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.style.width = `${cellSize}px`;
    cell.style.height = `${cellSize}px`;
    cells.push(cell);
  }
  board.replaceChildren(...cells);

  function render(): void {
    grid.forEach((row, r) => {
      row.forEach((color, c) => {
        const cell = cells[r * size + c];
        cell.style.background = color || "transparent";
        cell.dataset.color = color;
      });
    });
  }

  function applyTool(event: PointerEvent): void {
    const rect = board.getBoundingClientRect();
    const spot = cellFromPoint(event.clientX - rect.left, event.clientY - rect.top, cellSize, size);
    if (spot === null) return;
    const tool = toolSelect.value;
    if (tool === "fill") {
      grid = floodFill(grid, spot.row, spot.col, colorInput.value);
    } else {
      grid = paint(grid, spot.row, spot.col, tool === "eraser" ? "" : colorInput.value);
    }
    render();
  }

  function endStroke(): void {
    if (strokeStart === null) return;
    if (grid !== strokeStart) {
      history.push(strokeStart);
    }
    strokeStart = null;
  }

  board.addEventListener("pointerdown", (event) => {
    strokeStart = grid;
    board.setPointerCapture?.(event.pointerId);
    applyTool(event);
    if (toolSelect.value === "fill") endStroke();
  });
  board.addEventListener("pointermove", (event) => {
    if (strokeStart !== null) applyTool(event);
  });
  board.addEventListener("pointerup", endStroke);
  board.addEventListener("pointercancel", endStroke);

  undoButton.addEventListener("click", () => {
    const previous = history.pop();
    if (previous !== undefined) {
      grid = previous;
      render();
    }
  });
  clearButton.addEventListener("click", () => {
    history.push(grid);
    grid = createGrid(size);
    render();
  });
  exportButton.addEventListener("click", () => {
    svgOutput.value = toSvg(grid, cellSize);
  });

  render();
}
