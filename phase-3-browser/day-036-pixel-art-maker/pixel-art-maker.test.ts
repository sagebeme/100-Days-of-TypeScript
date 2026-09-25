// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createGrid, paint, cellFromPoint, floodFill, toSvg, type Grid } from "./starter/grid.ts";
import { mountPixelArt } from "./starter/app.ts";

const html = readFileSync(join(import.meta.dirname, "starter", "index.html"), "utf8");
const RED = "#e63946";
const BLUE = "#1d3557";

// Draws a grid from rows of letters: "." is empty, R is red, B is blue.
function gridOf(...rows: string[]): Grid {
  const colors: Record<string, string> = { ".": "", R: RED, B: BLUE };
  return rows.map((row) => [...row].map((letter) => colors[letter]));
}

describe("createGrid", () => {
  it("makes a square of empty cells", () => {
    expect(createGrid(3)).toEqual(gridOf("...", "...", "..."));
  });

  it("gives every row its own array", () => {
    const grid = createGrid(3);
    grid[0][0] = RED;
    expect(grid[1][0]).toBe("");
  });
});

describe("paint", () => {
  it("returns a new grid with one cell changed", () => {
    const grid = createGrid(3);
    const painted = paint(grid, 1, 2, RED);
    expect(painted).toEqual(gridOf("...", "..R", "..."));
    expect(grid).toEqual(createGrid(3));
  });

  it("returns the same grid when nothing would change", () => {
    const grid = gridOf("R..", "...", "...");
    expect(paint(grid, 0, 0, RED)).toBe(grid);
    expect(paint(grid, 3, 0, RED)).toBe(grid);
    expect(paint(grid, 0, -1, RED)).toBe(grid);
  });
});

describe("cellFromPoint", () => {
  it.each([
    [0, 0, { row: 0, col: 0 }],
    [45, 12, { row: 0, col: 2 }],
    [19.9, 20, { row: 1, col: 0 }],
    [319, 319, { row: 15, col: 15 }],
  ])("finds the cell at (%d, %d)", (x, y, expected) => {
    expect(cellFromPoint(x, y, 20, 16)).toEqual(expected);
  });

  it.each([
    [-1, 5],
    [5, -1],
    [320, 5],
    [5, 320],
  ])("gives null outside the grid at (%d, %d)", (x, y) => {
    expect(cellFromPoint(x, y, 20, 16)).toBeNull();
  });
});

describe("floodFill", () => {
  it("fills the connected area and stops at other colours", () => {
    const grid = gridOf(
      "..R..",
      "..R..",
      "RRR..",
      ".....",
    );
    expect(floodFill(grid, 0, 0, BLUE)).toEqual(gridOf(
      "BBR..",
      "BBR..",
      "RRR..",
      ".....",
    ));
  });

  it("does not leak through diagonals", () => {
    const grid = gridOf(
      ".R.",
      "R..",
      "...",
    );
    expect(floodFill(grid, 0, 0, BLUE)).toEqual(gridOf(
      "BR.",
      "R..",
      "...",
    ));
  });

  it("can repaint a coloured area", () => {
    expect(floodFill(gridOf("RR.", "R..", "..R"), 0, 1, BLUE)).toEqual(gridOf("BB.", "B..", "..R"));
  });

  it("fills a whole empty 16x16 grid", () => {
    const filled = floodFill(createGrid(16), 7, 7, RED);
    expect(filled.flat().every((c) => c === RED)).toBe(true);
  });

  it("returns the same grid when there's nothing to do, and never changes its input", () => {
    const grid = gridOf("R..", "...", "...");
    expect(floodFill(grid, 0, 0, RED)).toBe(grid);
    expect(floodFill(grid, 5, 5, BLUE)).toBe(grid);
    floodFill(grid, 2, 2, BLUE);
    expect(grid).toEqual(gridOf("R..", "...", "..."));
  });
});

describe("toSvg", () => {
  it("draws one rect per painted cell and skips empty ones", () => {
    expect(toSvg(gridOf("R.", ".B"), 10)).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">' +
        `<rect x="0" y="0" width="10" height="10" fill="${RED}"/>` +
        `<rect x="10" y="10" width="10" height="10" fill="${BLUE}"/>` +
        "</svg>",
    );
  });

  it("is an empty picture of the right size for an empty grid", () => {
    expect(toSvg(createGrid(16), 20)).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"></svg>',
    );
  });
});

describe("mountPixelArt", () => {
  const CELL = 20;

  beforeEach(() => {
    document.body.innerHTML = new DOMParser().parseFromString(html, "text/html").body.innerHTML;
    mountPixelArt(document, { size: 4, cellSize: CELL });
  });

  const board = () => document.querySelector<HTMLElement>("#board")!;
  const colorAt = (row: number, col: number) =>
    document.querySelectorAll<HTMLElement>("#board .cell")[row * 4 + col].dataset.color;
  const colors = () => [...document.querySelectorAll<HTMLElement>("#board .cell")].map((c) => c.dataset.color || ".");

  // The test browser lays nothing out, so the board sits at (0, 0) and clientX/Y are board positions.
  function pointer(type: string, row: number, col: number): void {
    board().dispatchEvent(
      new PointerEvent(type, { clientX: col * CELL + 5, clientY: row * CELL + 5, pointerId: 1, bubbles: true }),
    );
  }

  function stroke(...cells: [number, number][]): void {
    const [first, ...rest] = cells;
    pointer("pointerdown", ...first);
    for (const cell of rest) pointer("pointermove", ...cell);
    pointer("pointerup", ...cells[cells.length - 1]);
  }

  function useTool(tool: string, color = RED): void {
    document.querySelector<HTMLSelectElement>("#tool")!.value = tool;
    document.querySelector<HTMLInputElement>("#color")!.value = color;
  }

  const click = (selector: string) => document.querySelector<HTMLButtonElement>(selector)!.click();

  it("builds a size x size board of empty cells", () => {
    expect(document.querySelectorAll("#board .cell")).toHaveLength(16);
    expect(colors().every((c) => c === ".")).toBe(true);
  });

  it("paints the cell under the pointer", () => {
    useTool("pen");
    stroke([1, 2]);
    expect(colorAt(1, 2)).toBe(RED);
  });

  it("keeps painting while you drag, and stops after pointerup", () => {
    useTool("pen");
    stroke([0, 0], [0, 1], [1, 1]);
    pointer("pointermove", 3, 3);
    expect(colors().join("")).toBe(`${RED}${RED}..` + `.${RED}..` + "...." + "....");
  });

  it("erases", () => {
    useTool("pen");
    stroke([0, 0], [0, 1]);
    useTool("eraser");
    stroke([0, 0]);
    expect(colorAt(0, 0)).toBe("");
    expect(colorAt(0, 1)).toBe(RED);
  });

  it("flood-fills with the fill tool", () => {
    useTool("pen");
    stroke([0, 1], [1, 1], [1, 0]);
    useTool("fill", BLUE);
    stroke([3, 3]);
    expect(colorAt(0, 0)).toBe("");
    expect(colorAt(2, 2)).toBe(BLUE);
    expect(colorAt(0, 3)).toBe(BLUE);
  });

  it("undoes a whole stroke at once", () => {
    useTool("pen");
    stroke([0, 0]);
    stroke([2, 0], [2, 1], [2, 2]);
    click("#undo");
    expect(colorAt(0, 0)).toBe(RED);
    expect(colorAt(2, 1)).toBe("");
  });

  it("doesn't save an undo step for a stroke that changed nothing", () => {
    useTool("pen");
    stroke([0, 0]);
    stroke([0, 0]);
    click("#undo");
    expect(colorAt(0, 0)).toBe("");
  });

  it("clears, and the clear can be undone", () => {
    useTool("pen");
    stroke([1, 1]);
    click("#clear");
    expect(colorAt(1, 1)).toBe("");
    click("#undo");
    expect(colorAt(1, 1)).toBe(RED);
  });

  it("ignores Undo when there's nothing to undo", () => {
    click("#undo");
    expect(colors().every((c) => c === ".")).toBe(true);
  });

  it("exports the drawing as SVG", () => {
    useTool("pen");
    stroke([0, 0]);
    click("#export");
    expect(document.querySelector<HTMLTextAreaElement>("#svg")!.value).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">' +
        `<rect x="0" y="0" width="20" height="20" fill="${RED}"/>` +
        "</svg>",
    );
  });
});
