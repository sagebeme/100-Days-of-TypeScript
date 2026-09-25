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
  const canvas = getElement(root, "#print", HTMLCanvasElement);
  const newButton = getElement(root, "#new", HTMLButtonElement);
  const paletteSelect = getElement(root, "#palette", HTMLSelectElement);
  const seedLabel = getElement(root, "#seed", HTMLElement);

  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Canvas 2D is not supported here");
  }
  // A new const keeps the "not null" knowledge inside draw() below.
  const pen: Pen = context;
  canvas.width = options.width;
  canvas.height = options.height;

  let seed = options.seed;

  function draw(): void {
    const palette = PALETTES[paletteSelect.value] ?? PALETTES.sunset;
    renderPrint(
      pen,
      { width: options.width, height: options.height, tile: options.tile, palette: palette.colors, seed },
      palette.background,
    );
    seedLabel.textContent = `Print #${seed}`;
  }

  newButton.addEventListener("click", () => {
    seed += 1;
    draw();
  });
  paletteSelect.addEventListener("change", draw);
  draw();
}
