# Day 30: Split the Bill for the Squad — the Typed DOM and Null Checks

Watch the video: *(not recorded yet)*

## The brief

Six of you, one table of nyama choma, one bill. Somebody always pays KES 50 too little. Build a small page that splits it: type the total, the number of people and the tip, and the page tells everyone what to send. It updates as you type.

```
Total: 4800   People: 6   Tip: 10%
→ Each person pays KES 880 (tip KES 480)
```

This is the first day your TypeScript runs in a browser. The code that does the maths is plain TypeScript, like Phase 2. The new part is the DOM: finding elements on the page, reading what's typed, and writing the answer back.

## What you'll use

- `root.querySelector("#total")`, which returns `Element | null`. TypeScript makes you deal with the `null`
- `instanceof HTMLInputElement`, a runtime check that narrows `Element` to the exact element type, so `.value` exists
- A generic helper, `getElement(root, selector, HTMLInputElement)`, that does both checks once and throws a clear error
- `input.value`, which is **always a string**, even in `<input type="number">`
- `addEventListener("input", ...)`, which fires on every keystroke

## Run it

`index.html` loads `main.ts` directly. Browsers can't run TypeScript, so a dev server translates it on the fly. You get the full story of that tool (Vite) tomorrow. For today, from the repo root:

```bash
npm run dev -- phase-3-browser/day-030-split-the-bill/starter
```

Open the address it prints, usually `http://localhost:5173`. Press `Ctrl+C` in the terminal to stop it.

## Steps

1. Read `starter/index.html`. Note the ids: `#bill`, `#total`, `#people`, `#tip` and `#result`. `main.ts` is already written.
2. In `starter/split.ts`, write `splitBill(total, people, tipPercent)`:
   - The tip is `total × tipPercent / 100`, rounded to the nearest shilling.
   - `perPerson` is the grand total divided by the people, rounded **up**. M-Pesa has no cents, and rounding down would leave the bill short.
   - Throw `"Enter a total above 0"` for a total that isn't a positive number, `"Enter how many people are paying"` for people that isn't a whole number of 1 or more, and `"Tip can't be negative"` for a negative tip.
3. `formatKes(amount)`: `"KES 4,800"`. `amount.toLocaleString("en-US")` adds the commas.
4. In `starter/dom.ts`, write `getElement(root, selector, type)`. If nothing matches, throw `Missing element: #total`. If something matches but it's the wrong kind, throw `#total is not a HTMLInputElement` (`type.name` gives you the name).
5. In `starter/app.ts`, write `mountSplitter(root)`:
   - Find the five elements with `getElement`.
   - An `update()` function: if the total or the people box is empty, show `Enter the total and how many people`. Otherwise call `splitBill` and show `Each person pays KES 880 (tip KES 480)`. If `splitBill` throws, show its message.
   - Run `update()` on every `input` event on the form, and once straight away.
   - Stop the form's `submit` event from reloading the page (`event.preventDefault()`).
6. Run the tests. They load your `index.html` into a pretend browser and type into it:

   ```bash
   npm test -- day-030
   ```

## When you're stuck

- **`Object is possibly 'null'`** — that's the point of today. `querySelector` might find nothing. Use `getElement`, which checks and throws.
- **`Property 'value' does not exist on type 'Element'`** — a plain `Element` could be a `<div>`. Narrow it with `instanceof HTMLInputElement` first.
- **`KES 4800` plus `10` gives nonsense** — `input.value` is a string, and `"4800" + 10` is `"480010"`. Convert with `Number(...)`.
- **The page shows nothing and the console says `Missing element`** — your id in `app.ts` doesn't match `index.html`. The error says which one.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
