export type Shape =
  | { kind: "stripe"; y: number; width: number; height: number; color: string }
  | { kind: "circle"; x: number; y: number; radius: number; color: string }
  | { kind: "diamond"; x: number; y: number; size: number; color: string };

export interface PrintOptions {
  width: number;
  height: number;
  tile: number;
  palette: string[];
  seed: number;
}

// Only the drawing methods this file uses. A real canvas context fits, and so does a test fake.
export type Pen = Pick<
  CanvasRenderingContext2D,
  "fillStyle" | "fillRect" | "beginPath" | "arc" | "moveTo" | "lineTo" | "closePath" | "fill"
>;

// Already written: a seeded random number generator (the "mulberry32" algorithm).
// Same seed in, same sequence of numbers from 0 (inclusive) to 1 (exclusive) out.
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(items: readonly T[], random: () => number): T {
  // TODO: throw "Cannot pick from an empty list" if items is empty
  // TODO: return items[Math.floor(random() * items.length)]
  throw new Error("not implemented yet");
}

export function generatePrint(options: PrintOptions): Shape[] {
  // TODO: throw "Palette needs at least one colour" / "Tile must be above 0"
  // TODO: const random = createRandom(options.seed)
  // TODO: for each row: a stripe (y = row * tile, full width, height = tile * 0.2),
  //       then one shape per column, centred in its tile:
  //       even rows -> circle (radius = tile * 0.3), odd rows -> diamond (size = tile * 0.35)
  // TODO: every colour is pick(options.palette, random), in that exact order
  throw new Error("not implemented yet");
}

export function drawShape(pen: Pen, shape: Shape): void {
  // TODO: pen.fillStyle = shape.color, then switch on shape.kind:
  //   stripe  -> fillRect(0, y, width, height)
  //   circle  -> beginPath, arc(x, y, radius, 0, Math.PI * 2), fill
  //   diamond -> beginPath, moveTo top, lineTo right, bottom, left, closePath, fill
  // TODO: a default case that assigns shape to a `never`
  throw new Error("not implemented yet");
}

export function renderPrint(pen: Pen, options: PrintOptions, background: string): void {
  // TODO: fill the whole canvas with `background`, then draw every shape from generatePrint
  throw new Error("not implemented yet");
}
