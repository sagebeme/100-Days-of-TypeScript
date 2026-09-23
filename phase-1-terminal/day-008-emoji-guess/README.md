# Day 8: Guess the Artist From Emoji Clues

Watch the video: *(not recorded yet)*

## The brief

🌊🎤 — that's your clue, guess the artist. A real game would read guesses from the keyboard one at a time; today you'll write the part that decides *when the game ends*, given a list of guesses someone already made.

```
countAttemptsUntilCorrect(["Sauti Sol", "Bien", "Nyashinski"], "Nyashinski")  →  3
countAttemptsUntilCorrect(["Wrong"], "Right")                                →  -1
```

## What you'll use

- `while` loops, which keep running as long as a condition stays true — useful when you don't know in advance how many times you'll loop
- **Game state**: a couple of `let` variables (how many attempts so far, which guess you're checking) that change on every pass through the loop

## Steps

1. Open `starter/emoji-guess.ts`.
2. Declare `let attempts = 0` and `let index = 0`.
3. `while (index < guesses.length)`:
   - Increment `attempts` by 1.
   - If `guesses[index]` equals `answer`, return `attempts` immediately.
   - Otherwise, increment `index` by 1.
4. If the loop finishes without a match, return `-1` — nobody guessed right.

```bash
npm test -- day-008
```

## When you're stuck

- **Infinite loop, test never finishes** — you're not incrementing `index` inside the `while` loop, so the condition never becomes false. Every path through the loop body needs to eventually move `index` forward.
- **Off-by-one on `attempts`** — increment `attempts` *before* you check whether the guess is correct, not after. The first guess is attempt 1, not attempt 0.
- **Still stuck?** Read `solution/emoji-guess.ts`, then close it and write your own from memory.
