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
  if (items.length === 0) {
    throw new Error("Cannot pick from an empty list");
  }
  return items[Math.floor(random() * items.length)];
}

export function generatePrint(options: PrintOptions): Shape[] {
  const { width, height, tile, palette } = options;
  if (palette.length === 0) {
    throw new Error("Palette needs at least one colour");
  }
  if (tile <= 0) {
    throw new Error("Tile must be above 0");
  }

  const random = createRandom(options.seed);
  const rows = Math.ceil(height / tile);
  const cols = Math.ceil(width / tile);
  const shapes: Shape[] = [];

  for (let row = 0; row < rows; row++) {
    shapes.push({ kind: "stripe", y: row * tile, width, height: tile * 0.2, color: pick(palette, random) });
    for (let col = 0; col < cols; col++) {
      const x = col * tile + tile / 2;
      const y = row * tile + tile / 2;
      const color = pick(palette, random);
      if (row % 2 === 0) {
        shapes.push({ kind: "circle", x, y, radius: tile * 0.3, color });
      } else {
        shapes.push({ kind: "diamond", x, y, size: tile * 0.35, color });
      }
    }
  }
  return shapes;
}

export function drawShape(pen: Pen, shape: Shape): void {
  pen.fillStyle = shape.color;
  switch (shape.kind) {
    case "stripe":
      pen.fillRect(0, shape.y, shape.width, shape.height);
      break;
    case "circle":
      pen.beginPath();
      pen.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
      pen.fill();
      break;
    case "diamond":
      pen.beginPath();
      pen.moveTo(shape.x, shape.y - shape.size);
      pen.lineTo(shape.x + shape.size, shape.y);
      pen.lineTo(shape.x, shape.y + shape.size);
      pen.lineTo(shape.x - shape.size, shape.y);
      pen.closePath();
      pen.fill();
      break;
    default: {
      const unknownShape: never = shape;
      throw new Error(`Unknown shape: ${JSON.stringify(unknownShape)}`);
    }
  }
}

export function renderPrint(pen: Pen, options: PrintOptions, background: string): void {
  pen.fillStyle = background;
  pen.fillRect(0, 0, options.width, options.height);
  for (const shape of generatePrint(options)) {
    drawShape(pen, shape);
  }
}
