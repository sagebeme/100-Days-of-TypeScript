# Day 4: Sheng vs Gen Z Slang Quiz

Watch the video: *(not recorded yet)*

## The brief

A quiz that picks a random slang word — Sheng like "noma" and "mbogi", or Gen Z like "rizz" and "no cap" — and asks the player what it means. The picking part is today's problem: write a function that grabs a random item from an array.

```
pickRandomWord(["noma", "mbogi", "poa"])   →  one of those three, picked at random
```

## What you'll use

- **Arrays** (`string[]`) as an ordered list of values
- `Math.random()`, which returns a number from 0 up to (but never quite reaching) 1
- A function parameter with a **default value** — a preview of something you'll use constantly from here on

## Steps

1. Open `starter/slang-quiz.ts`.
2. Inside `pickRandomWord`, turn `random()` (a number between 0 and 1) into a valid array index: multiply it by `words.length`, then round down with `Math.floor`.
3. Return `words[index]`.

```bash
npm test -- day-004
```

## Why does `pickRandomWord` take a `random` parameter instead of just calling `Math.random()` itself?

So the tests can control it. `Math.random()` is different every time — there's no way to write `expect(pickRandomWord(words)).toBe(???)` and have it reliably pass. By accepting `random` as a parameter (defaulting to `Math.random` if you don't pass one), the real function still uses genuine randomness when you run it yourself, but a test can pass in `() => 0` or `() => 0.99` and know exactly which word to expect. You'll use this trick — swap the unpredictable part for something you control — throughout the course.

## When you're stuck

- **Getting `undefined` back** — `Math.floor(random() * words.length)` should always land between `0` and `words.length - 1`. If you're seeing `undefined`, check you multiplied by `words.length` and not something else.
- **"Cannot invoke an object which is possibly 'undefined'"** — this means you're trying to call `random` before checking it has a default. Check the parameter is declared as `random: () => number = Math.random`, with the default *after* the type annotation.
- **Still stuck?** Read `solution/slang-quiz.ts`, then close it and write your own from memory.
