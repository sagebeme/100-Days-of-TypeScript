# Day 35: Kitenge Print Generator — Canvas 2D

Watch the video: *(not recorded yet)*

## The brief

Kitenge prints are bold, repeating patterns: rows of circles and diamonds between stripes, in three or four strong colours. Build a generator that paints a new one every time you press a button. Pick a palette, press **New print**, and screenshot the one you like for a phone wallpaper or a merch mock-up.

Every print comes from a **seed**, a number. The same seed always paints the same print, so `Print #42` is a print you can find again, and something the tests can check.

```
generatePrint({ width: 200, height: 100, tile: 50, palette: PALETTES.sunset.colors, seed: 42 })
→ [ { kind: "stripe",  y: 0,  width: 200, height: 10, color: "#2a9d8f" },
    { kind: "circle",  x: 25, y: 25, radius: 15, color: "#f4a261" },
    { kind: "circle",  x: 75, y: 25, radius: 15, color: "#264653" },
    ...                                                    (row 0: 4 circles)
    { kind: "stripe",  y: 50, width: 200, height: 10, color: "#2a9d8f" },
    { kind: "diamond", x: 25, y: 75, size: 17.5, color: "#f4a261" },
    ... ]                                                  (row 1: 4 diamonds)
```

## What you'll use

- `<canvas>` and `canvas.getContext("2d")`, which can return `null`, so you check it
- Paths: `beginPath`, `arc`, `moveTo`, `lineTo`, `closePath`, `fill`, and `fillStyle` / `fillRect`
- A discriminated union of shapes (Day 20) and a `switch` with a `never` check, so a new shape can't be forgotten
- Keeping the *what* (a list of shapes, easy to test) apart from the *how* (drawing them)
- `Pick<CanvasRenderingContext2D, ...>`: asking for only the drawing methods you use, so a test can pass in a fake "pen" that records every call

## Steps

1. Start the dev server:

   ```bash
   npm run dev -- phase-3-browser/day-035-kitenge-print/starter
   ```

2. `createRandom(seed)` in `starter/pattern.ts` is already written. It returns a function that gives a new number from 0 up to 1 on every call, like `Math.random`, except the same seed gives the same numbers every time.
3. `pick(items, random)`: one item from the list, chosen with `random()`. Throw `Cannot pick from an empty list` for an empty list.
4. `generatePrint(options)`:
   - Throw `Palette needs at least one colour` for an empty palette, and `Tile must be above 0` for a tile of 0 or less.
   - The grid has `Math.ceil(height / tile)` rows and `Math.ceil(width / tile)` columns.
   - For each row, first a stripe across the top of the row: `y` is `row × tile`, `width` is the full width, `height` is `tile × 0.2`.
   - Then one shape per column, centred in its tile. Even rows (0, 2, …) get circles with `radius` `tile × 0.3`. Odd rows get diamonds with `size` `tile × 0.35` (from the centre to a point).
   - Every colour comes from `pick(palette, random)`, and you pick in exactly that order (stripe, then shapes left to right) so a seed always gives the same print.
5. `drawShape(pen, shape)`: set `fillStyle`, then draw. A stripe is one `fillRect(0, y, width, height)`. A circle is `beginPath`, `arc(x, y, radius, 0, Math.PI * 2)`, `fill`. A diamond is `beginPath`, then `moveTo` the top point, `lineTo` right, bottom and left, `closePath`, `fill`.
6. `renderPrint(pen, options, background)`: fill the whole canvas with the background, then draw every shape.
7. In `starter/app.ts`, write `mountKitenge(root, options)`:
   - Get the 2D context from `#print`. If it's `null`, throw `Canvas 2D is not supported here`.
   - Set the canvas `width` and `height` from the options, then draw.
   - `#seed` shows `Print #42`. **New print** (`#new`) adds 1 to the seed and draws again. Changing `#palette` draws again with the same seed.
8. Run the tests:

   ```bash
   npm test -- day-035
   ```

## When you're stuck

- **The canvas is blurry** — setting the size with CSS stretches it. Set `canvas.width` and `canvas.height` in code.
- **Circles join up with lines between them** — you forgot `beginPath()` before each shape, so they all became one path.
- **The same seed gives a different print** — you called `random()` in a different order, or an extra time. Stripe first, then the row's shapes left to right.
- **`Object is possibly 'null'` on `getContext`** — some browsers (and the test browser) have no canvas support. Check and throw.
- **You checked for `null`, but `draw()` still complains** — TypeScript forgets the check inside a `function` declared later, because the function could run at any time. Copy the checked value into a new `const pen: Pen = context` and use that.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
