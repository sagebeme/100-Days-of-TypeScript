// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRandom, pick, generatePrint, drawShape, renderPrint, type Pen } from "./starter/pattern.ts";
import { mountKitenge } from "./starter/app.ts";
import { PALETTES } from "./starter/palettes.ts";

const html = readFileSync(join(import.meta.dirname, "starter", "index.html"), "utf8");
const sunset = PALETTES.sunset.colors;
const small = { width: 200, height: 100, tile: 50, palette: sunset, seed: 42 };

// A pretend canvas context that writes down every call instead of drawing.
class RecordingPen implements Pen {
  calls: string[] = [];
  #fill: Pen["fillStyle"] = "";
  get fillStyle(): Pen["fillStyle"] {
    return this.#fill;
  }
  set fillStyle(value: Pen["fillStyle"]) {
    this.#fill = value;
    this.calls.push(`fillStyle ${String(value)}`);
  }
  fillRect(x: number, y: number, w: number, h: number): void {
    this.calls.push(`fillRect ${x} ${y} ${w} ${h}`);
  }
  beginPath(): void {
    this.calls.push("beginPath");
  }
  arc(x: number, y: number, r: number, start: number, end: number): void {
    this.calls.push(`arc ${x} ${y} ${r} ${start} ${end.toFixed(4)}`);
  }
  moveTo(x: number, y: number): void {
    this.calls.push(`moveTo ${x} ${y}`);
  }
  lineTo(x: number, y: number): void {
    this.calls.push(`lineTo ${x} ${y}`);
  }
  closePath(): void {
    this.calls.push("closePath");
  }
  fill(): void {
    this.calls.push("fill");
  }
}

describe("pick", () => {
  it("uses the random number to choose", () => {
    const items = ["a", "b", "c", "d"];
    expect(pick(items, () => 0)).toBe("a");
    expect(pick(items, () => 0.5)).toBe("c");
    expect(pick(items, () => 0.9999)).toBe("d");
  });

  it("throws for an empty list", () => {
    expect(() => pick([], Math.random)).toThrow("Cannot pick from an empty list");
  });
});

describe("generatePrint", () => {
  it("makes a stripe plus one shape per column for every row", () => {
    const shapes = generatePrint(small);
    expect(shapes.map((s) => s.kind)).toEqual([
      "stripe", "circle", "circle", "circle", "circle",
      "stripe", "diamond", "diamond", "diamond", "diamond",
    ]);
  });

  it("places and sizes each shape in its tile", () => {
    const [stripe, circle, , , , stripe2, diamond] = generatePrint(small);
    expect(stripe).toMatchObject({ kind: "stripe", y: 0, width: 200, height: 10 });
    expect(circle).toMatchObject({ kind: "circle", x: 25, y: 25, radius: 15 });
    expect(stripe2).toMatchObject({ kind: "stripe", y: 50 });
    expect(diamond).toMatchObject({ kind: "diamond", x: 25, y: 75, size: 17.5 });
  });

  it("covers a canvas that isn't a whole number of tiles", () => {
    const shapes = generatePrint({ ...small, width: 210, height: 120 });
    expect(shapes.filter((s) => s.kind === "stripe")).toHaveLength(3);
    expect(shapes.filter((s) => s.kind !== "stripe")).toHaveLength(15);
  });

  it("only uses colours from the palette", () => {
    for (const shape of generatePrint({ ...small, width: 800, height: 500 })) {
      expect(sunset).toContain(shape.color);
    }
  });

  it("picks colours in order: stripe, then the row's shapes left to right", () => {
    const random = createRandom(42);
    const expected = Array.from({ length: 10 }, () => pick(sunset, random));
    expect(generatePrint(small).map((s) => s.color)).toEqual(expected);
  });

  it("paints the same print for the same seed, and a different one for another seed", () => {
    const big = { ...small, width: 800, height: 500 };
    expect(generatePrint(big)).toEqual(generatePrint(big));
    expect(generatePrint({ ...big, seed: 43 })).not.toEqual(generatePrint(big));
  });

  it("rejects an empty palette and a bad tile size", () => {
    expect(() => generatePrint({ ...small, palette: [] })).toThrow("Palette needs at least one colour");
    expect(() => generatePrint({ ...small, tile: 0 })).toThrow("Tile must be above 0");
  });
});

describe("drawShape", () => {
  it("draws a stripe as one rectangle", () => {
    const pen = new RecordingPen();
    drawShape(pen, { kind: "stripe", y: 50, width: 200, height: 10, color: "#111" });
    expect(pen.calls).toEqual(["fillStyle #111", "fillRect 0 50 200 10"]);
  });

  it("draws a circle as a full arc on its own path", () => {
    const pen = new RecordingPen();
    drawShape(pen, { kind: "circle", x: 25, y: 25, radius: 15, color: "#222" });
    expect(pen.calls).toEqual(["fillStyle #222", "beginPath", "arc 25 25 15 0 6.2832", "fill"]);
  });

  it("draws a diamond as four points: top, right, bottom, left", () => {
    const pen = new RecordingPen();
    drawShape(pen, { kind: "diamond", x: 25, y: 75, size: 10, color: "#333" });
    expect(pen.calls).toEqual([
      "fillStyle #333",
      "beginPath",
      "moveTo 25 65",
      "lineTo 35 75",
      "lineTo 25 85",
      "lineTo 15 75",
      "closePath",
      "fill",
    ]);
  });
});

describe("renderPrint", () => {
  it("fills the background first, then draws every shape", () => {
    const pen = new RecordingPen();
    renderPrint(pen, small, "#fff3e0");
    expect(pen.calls.slice(0, 2)).toEqual(["fillStyle #fff3e0", "fillRect 0 0 200 100"]);

    const expected = new RecordingPen();
    for (const shape of generatePrint(small)) drawShape(expected, shape);
    expect(pen.calls.slice(2)).toEqual(expected.calls);
  });
});

describe("mountKitenge", () => {
  let pen: RecordingPen;

  beforeEach(() => {
    document.body.innerHTML = new DOMParser().parseFromString(html, "text/html").body.innerHTML;
    pen = new RecordingPen();
    // The test browser has no real canvas, so hand out the recording pen instead.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(pen as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => vi.restoreAllMocks());

  const canvas = () => document.querySelector<HTMLCanvasElement>("#print")!;
  const seedText = () => document.querySelector("#seed")?.textContent;
  const circles = () => pen.calls.filter((c) => c.startsWith("arc")).length;

  it("sizes the canvas and draws the first print", () => {
    mountKitenge(document, { width: 200, height: 100, tile: 50, seed: 42 });
    expect(canvas().width).toBe(200);
    expect(canvas().height).toBe(100);
    expect(seedText()).toBe("Print #42");
    expect(pen.calls[0]).toBe(`fillStyle ${PALETTES.sunset.background}`);
    expect(circles()).toBe(4);
  });

  it("draws the next seed on New print", () => {
    mountKitenge(document, { width: 200, height: 100, tile: 50, seed: 42 });
    pen.calls = [];
    document.querySelector<HTMLButtonElement>("#new")!.click();
    expect(seedText()).toBe("Print #43");

    const expected = new RecordingPen();
    renderPrint(expected, { ...small, seed: 43 }, PALETTES.sunset.background);
    expect(pen.calls).toEqual(expected.calls);
  });

  it("redraws with the chosen palette and the same seed", () => {
    mountKitenge(document, { width: 200, height: 100, tile: 50, seed: 42 });
    pen.calls = [];
    const select = document.querySelector<HTMLSelectElement>("#palette")!;
    select.value = "lake";
    select.dispatchEvent(new Event("change"));
    expect(seedText()).toBe("Print #42");

    const expected = new RecordingPen();
    renderPrint(expected, { ...small, palette: PALETTES.lake.colors }, PALETTES.lake.background);
    expect(pen.calls).toEqual(expected.calls);
  });

  it("throws a clear error when there's no 2D canvas", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(() => mountKitenge(document, { width: 200, height: 100, tile: 50, seed: 1 })).toThrow(
      "Canvas 2D is not supported here",
    );
  });
});
