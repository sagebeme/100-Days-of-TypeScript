# Day 36: Sticker and Pixel Art Maker — Pointer Events

Watch the video: *(not recorded yet)*

## The brief

Draw a 16×16 pixel sticker (a matatu, a football, a jollof pot) with a mouse, a finger or a stylus, then export it as an SVG you can drop into a WhatsApp sticker maker or a website. It has a pen, an eraser, a paint-bucket fill, Undo and Clear.

```
cellFromPoint(45, 12, 20, 16)   →  { row: 0, col: 2 }
paint(grid, 0, 2, "#e63946")    →  a new grid with that one cell coloured
floodFill(grid, 5, 5, "#ffd166") →  the whole connected area around (5, 5) coloured
toSvg(grid, 20)                 →  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" ...><rect .../>...</svg>'
```

## What you'll use

- **Pointer events**: `pointerdown`, `pointermove`, `pointerup` and `pointercancel`. One set of events covers mouse, touch and pen, so you don't write the code three times
- `setPointerCapture`, so a stroke keeps going when your finger slides off the board
- `event.clientX - rect.left`, from `getBoundingClientRect()`, to turn a screen position into a spot on the board
- `touch-action: none` in the CSS, so dragging a finger draws instead of scrolling the page
- A grid as `string[][]`, changed only by returning new grids. That makes Undo a stack of old grids
- Flood fill: a queue of cells to visit, the same idea a paint bucket uses in every drawing app

## Steps

1. Start the dev server:

   ```bash
   npm run dev -- phase-3-browser/day-036-pixel-art-maker/starter
   ```

2. In `starter/grid.ts` (`""` means an empty, see-through cell):
   - `createGrid(size)`: `size` rows of `size` empty cells. Each row must be its own array.
   - `paint(grid, row, col, color)`: a new grid with one cell changed. If the spot is off the grid, or the cell already has that colour, return **the same grid** (`===`). Undo uses that to tell whether anything changed.
   - `cellFromPoint(x, y, cellSize, size)`: which cell a point is in, or `null` outside the grid.
   - `floodFill(grid, row, col, color)`: colour the cell and every cell joined to it (up, down, left, right, not diagonally) that had the same starting colour. Off the grid, or already that colour: the same grid back.
   - `toSvg(grid, cellSize)`: an `<svg>` with `xmlns`, `width`, `height` and `viewBox`, and one `<rect x y width height fill>` per painted cell, row by row. Skip empty cells, so the sticker's background stays see-through.
3. In `starter/app.ts`, write `mountPixelArt(root, options)`:
   - Fill `#board` with `size × size` `<div class="cell">` elements once. Drawing only updates them: set each cell's `style.background` and `dataset.color` (the tests read `data-color`).
   - `pointerdown` on the board starts a stroke: save the current grid for Undo, capture the pointer, and use the tool on that cell. **Pen** paints with `#color`, **Eraser** paints `""`, **Fill** flood-fills.
   - `pointermove` keeps drawing while a pen or eraser stroke is going. `pointerup` and `pointercancel` end it. If the stroke changed nothing, throw away the Undo entry you saved.
   - `#undo` puts back the last saved grid. `#clear` saves the grid, then empties it.
   - `#export` puts `toSvg(...)` into the `#svg` text box.
4. Run the tests:

   ```bash
   npm test -- day-036
   ```

5. Draw something, export it, paste the SVG into a file called `sticker.svg`, and open it in your browser.

## When you're stuck

- **Dragging on a phone scrolls the page** — add `touch-action: none` to the board's CSS. It's already in `index.html`; check you didn't remove it.
- **Painting one cell changes the whole column** — `Array(size).fill([])` puts the *same* row array in every row. Build each row with `Array.from`.
- **Undo needs two presses** — you saved a history entry for a click that changed nothing. Compare the grid before and after the stroke.
- **Flood fill freezes the tab** — you're visiting cells you've already coloured. Only add neighbours that still have the starting colour.
- **A fast swipe leaves gaps** — `pointermove` doesn't fire for every cell a fast pointer crosses. That's normal; filling the gaps is a good extra challenge.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
