# Day 15: Pro Setup — Know Your Machinery

Watch the video: *(not recorded yet)*

## The brief

Phase 2 is about describing your data precisely with types, and that only works if you understand what's checking those types. For 14 days you've run `npm test` and `npm run typecheck` without opening the config files behind them. Today you read them, change them, and see what breaks.

Then you write one small function that only makes sense with `strict` mode on: finding the first number above a threshold, when there might not be one.

```
firstAbove([3, 8, 12], 5)                →  8
firstAbove([1, 2], 5)                    →  undefined
firstAboveOrDefault([1, 2], 5, 99)       →  99
firstAboveOrDefault([0, 5], -1, 99)      →  0     (0 is a real answer, not "missing")
```

## What you'll use

- `tsconfig.json`, the compiler's rulebook for this repo
- `package.json`, which lists the tools and the commands (`npm test`, `npm run typecheck`)
- `vitest.config.ts`, which tells the test runner which files are tests
- `number | undefined`: a return type that says "you might get nothing back"

## Tour: what each file does

| File | What it does |
| --- | --- |
| `package.json` | Lists your dev tools (TypeScript, Vitest) and the `scripts` you run. `"type": "module"` makes every `.ts` file use `import`/`export`. |
| `tsconfig.json` | Configures `tsc`. It only **checks** your code (`noEmit`); Node runs the `.ts` files itself. |
| `vitest.config.ts` | Says test files match `phase-*/**/*.test.ts`. |
| `phase-*/day-*/*.test.ts` | The tests. They import from `./starter/`, so they test *your* code. |

The most important line in `tsconfig.json` is `"strict": true`. It switches on a family of checks, including the one that makes `undefined` a real, separate type instead of something that silently sneaks into every variable.

## Steps

1. Read `tsconfig.json` and `package.json` at the root of the repo. For each setting in `compilerOptions`, guess what it does, then look it up. You don't need to memorise them, just know they exist.
2. Open `starter/pro-setup.ts`. Write `firstAbove(numbers, threshold)`: return the first number greater than `threshold`, or `undefined` if there isn't one. `numbers.find(...)` does most of the work.
3. Write `firstAboveOrDefault(numbers, threshold, fallback)`: call `firstAbove` and return its result, or `fallback` if it was `undefined`. Compare against `undefined` explicitly. The last example above is the reason: `0` is a real answer, and a shortcut like `found || fallback` would wrongly replace it.
4. Run the tests:

   ```bash
   npm test -- day-015
   ```

5. **Experiment.** Open `tsconfig.json`, change `"strict": true` to `"strict": false`, and run `npm run typecheck`. Then re-break your own function on purpose: make `firstAboveOrDefault` return `firstAbove(...)` directly and see what the compiler says with `strict` on versus off. Put `"strict": true` back when you're done.

## When you're stuck

- **`npm run typecheck` says "Type 'number | undefined' is not assignable to type 'number'"** — that's `strict` protecting you. You returned something that might be `undefined` from a function that promised a `number`. Check for `undefined` first.
- **Your test for `[0, 5]` fails** — you probably used `||` or an `if (!found)` check. `0` is falsy in JavaScript. Use `found === undefined`.
- **After the experiment, errors won't go away** — make sure `"strict"` is back to `true` and saved.
- **Still stuck?** Read `solution/pro-setup.ts`, then close it and write your own from memory.
