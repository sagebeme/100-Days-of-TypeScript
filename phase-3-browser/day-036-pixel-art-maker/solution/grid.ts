// grid[row][col] is a CSS colour, or "" for an empty, see-through cell.
export type Grid = string[][];

export interface Cell {
  row: number;
  col: number;
}

export function createGrid(size: number): Grid {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
}

function inside(grid: Grid, row: number, col: number): boolean {
  return row >= 0 && row < grid.length && col >= 0 && col < (grid[row]?.length ?? 0);
}

export function paint(grid: Grid, row: number, col: number, color: string): Grid {
  if (!inside(grid, row, col) || grid[row][col] === color) {
    return grid;
  }
  return grid.map((cells, r) => (r === row ? cells.map((cell, c) => (c === col ? color : cell)) : cells));
}

export function cellFromPoint(x: number, y: number, cellSize: number, size: number): Cell | null {
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  if (row < 0 || row >= size || col < 0 || col >= size) {
    return null;
  }
  return { row, col };
}

export function floodFill(grid: Grid, row: number, col: number, color: string): Grid {
  if (!inside(grid, row, col) || grid[row][col] === color) {
    return grid;
  }
  const target = grid[row][col];
  const next = grid.map((cells) => [...cells]);
  const queue: Cell[] = [{ row, col }];
  next[row][col] = color;

  while (queue.length > 0) {
    const cell = queue.shift()!;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const r = cell.row + dr;
      const c = cell.col + dc;
      if (inside(next, r, c) && next[r][c] === target) {
        next[r][c] = color;
        queue.push({ row: r, col: c });
      }
    }
  }
  return next;
}

export function toSvg(grid: Grid, cellSize: number): string {
  const height = grid.length * cellSize;
  const width = (grid[0]?.length ?? 0) * cellSize;
  const rects: string[] = [];
  grid.forEach((cells, row) => {
    cells.forEach((color, col) => {
      if (color !== "") {
        rects.push(
          `<rect x="${col * cellSize}" y="${row * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}"/>`,
        );
      }
    });
  });
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    rects.join("") +
    "</svg>"
  );
}
