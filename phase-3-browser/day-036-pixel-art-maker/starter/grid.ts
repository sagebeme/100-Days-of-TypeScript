// grid[row][col] is a CSS colour, or "" for an empty, see-through cell.
export type Grid = string[][];

export interface Cell {
  row: number;
  col: number;
}

export function createGrid(size: number): Grid {
  // TODO: `size` rows of `size` "" cells, every row its own array
  throw new Error("not implemented yet");
}

export function paint(grid: Grid, row: number, col: number, color: string): Grid {
  // TODO: off the grid, or already that colour -> return the SAME grid
  // TODO: otherwise a new grid with that one cell changed (don't change `grid`)
  throw new Error("not implemented yet");
}

export function cellFromPoint(x: number, y: number, cellSize: number, size: number): Cell | null {
  // TODO: which cell (x, y) falls in, or null if it's outside the size x size grid
  throw new Error("not implemented yet");
}

export function floodFill(grid: Grid, row: number, col: number, color: string): Grid {
  // TODO: off the grid, or already that colour -> the SAME grid
  // TODO: copy the grid, then visit cells with a queue, starting at (row, col):
  //       colour each one, and add its up/down/left/right neighbours that still have the starting colour
  throw new Error("not implemented yet");
}

export function toSvg(grid: Grid, cellSize: number): string {
  // TODO: <svg xmlns="http://www.w3.org/2000/svg" width="W" height="H" viewBox="0 0 W H">
  //       then <rect x="…" y="…" width="…" height="…" fill="…"/> for each painted cell, row by row
  //       then </svg>
  throw new Error("not implemented yet");
}
