# Day 12: Debugging Day — Fix the Broken Bot

Watch the video: *(not recorded yet)*

## The brief

Today you don't write a new function. You inherit one that's broken. `craftReply` is meant to build a chatbot reply by repeating the user's message a few times, and set the bot's mood to `"annoyed"` if it's been asked to repeat more than 3 times, otherwise `"happy"`.

```
craftReply("hi", 2)  →  { message: "hihi", mood: "happy" }
craftReply("go", 5)  →  { message: "gogogogogo", mood: "annoyed" }
```

The code in `starter/fix-the-bot.ts` has **two bugs**, and they're different kinds:

1. One the **compiler** will point out to you.
2. One the compiler *can't* see. Only a failing test reveals it.

## What you'll use

- `npm run typecheck` — runs `tsc` over the whole repo and prints every type error with a file, line, and message
- Reading an error message from top to bottom instead of skimming for the first red word

## Steps

1. Run the type checker and read what it says about `starter/fix-the-bot.ts`:

   ```bash
   npm run typecheck
   ```

   Find the error that points at that file. It names the line, the property that's wrong, and often suggests the fix ("Did you mean...?").
2. Fix that bug.
3. Now run the tests. At least one still fails even though the type error is gone:

   ```bash
   npm test -- day-012
   ```

4. Read what the failing test says it *expected* versus what it *got*, and trace through the loop by hand with a small input like `("hi", 2)` until you find the difference.
5. Fix the second bug. Tests pass.

## When you're stuck

- **The type checker lists errors in other days' files** — ignore those; only fix errors pointing at `day-012-fix-the-bot`.
- **Tests fail with the wrong number of repeats** — count how many times the loop body runs for `repeatCount = 2`. Then look at the loop's condition and starting value closely. The classic mistake is a loop that runs one time too many or too few.
- **Compiler error but you can't spot the typo** — read the error's *property name* out loud and compare it letter by letter with the property name in the type definition above.
- **Still stuck?** Read `solution/fix-the-bot.ts`, then close it, re-break your version, and fix it again from memory.
