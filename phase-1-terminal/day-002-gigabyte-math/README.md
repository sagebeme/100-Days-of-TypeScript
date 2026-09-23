# Day 2: How Far Does 1 GB Go?

Watch the video: *(not recorded yet)*

## The brief

You've just topped up a data bundle. Before it runs out, you want to know: how many minutes of video does it actually buy you? Write a function that does the maths.

```
estimateVideoMinutes(1, 8)     →  128   (1 GB, video uses 8 MB per minute)
estimateVideoMinutes(2, 10)    →  204
```

## What you'll use

- `number`, the type for anything you'd do arithmetic with
- Explicit type annotations (`const total: number = ...`) — TypeScript can usually guess the type on its own, but writing it out makes your intent clear while you're still getting used to reading types

## Steps

1. Open `starter/gigabyte-math.ts`.
2. Declare `const totalMegabytes: number`, equal to `gigabytes * 1024` (1 GB = 1024 MB).
3. Declare `const minutes: number`, equal to `totalMegabytes / megabytesPerMinute`.
4. Return `minutes` rounded down to a whole number with `Math.floor(minutes)` — you can't watch a fraction of a minute.

```bash
npm test -- day-002
```

## When you're stuck

- **Your answer is off by a fraction, like `128.5` instead of `128`** — you forgot `Math.floor`. Division in TypeScript doesn't round on its own.
- **"Type 'number' is not assignable to type 'string'" or similar** — check you wrote `: number` and not `: string` on your `const` declarations. The colon comes right after the variable name, before the `=`.
- **Still stuck?** Read `solution/gigabyte-math.ts`, then close it and write your own from memory.
