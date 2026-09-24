# Day 13: Split the Menu — Modules

Watch the video: *(not recorded yet)*

## The brief

Your street-food stall now has enough code that one file is getting crowded. Split it in two: `menu.ts` holds the menu and a way to look items up, and `receipt.ts` uses the menu to work out what a customer owes.

```
orderTotal(["Chips Masala", "Soda"])  →  260
orderTotal([])                        →  0
orderTotal(["Pizza"])                 →  throws "Unknown item: Pizza"
```

## What you'll use

- `export` to make a function, type, or value available to other files
- `import { thing } from "./other.ts"` to use it (note the `.ts` extension, this project runs TypeScript directly)
- `Array.prototype.find`, which returns the matching element or `undefined`
- A return type of `MenuItem | undefined`, which makes the compiler force you to handle "not found"

## Steps

1. Open `starter/menu.ts`. The `MenuItem` type and the `menu` array are already there and exported. Write `findItem(name)`: return the item whose `name` matches, or `undefined`. `menu.find(...)` does the work.
2. Open `starter/receipt.ts`. It already imports `findItem` from `./menu.ts`, so you don't retype anything.
3. Write `orderTotal(itemNames)`: loop over the names, look each one up with `findItem`, and add up the prices.
4. If `findItem` returns `undefined`, ``throw new Error(`Unknown item: ${name}`)``. Because `findItem`'s return type includes `undefined`, TypeScript won't let you read `.price` until you've handled that case. Follow what the red squiggle asks for.
5. Run the tests:

   ```bash
   npm test -- day-013
   ```

## When you're stuck

- **"Cannot find module" or "does not provide an export named..."** — check that the thing you're importing has the word `export` in front of it in the other file, and that the import path starts with `./` and ends with `.ts`.
- **"'item' is possibly 'undefined'"** — that's the compiler doing its job. Add an `if (item === undefined) { throw ... }` before you touch `item.price`. After that check, TypeScript knows it's a real item.
- **Total is off** — log each item you find and its price to see which lookup is wrong.
- **Still stuck?** Read `solution/menu.ts` and `solution/receipt.ts`, then close them and write your own from memory.
