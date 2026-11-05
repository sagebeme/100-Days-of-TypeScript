# Phase 1 Recap: Terminal Foundations

Days 1–14. You wrote TypeScript that runs in the terminal, one small program a day, from an M-Pesa confirmation text to a text adventure set in Nairobi's CBD.

## What this phase taught

Values and types, decisions and loops, functions that do one job each, and splitting a program into modules. Every day had tests, so "done" meant the tests passed, not "it looks right to me".

## Key ideas

1. **`const` by default, `let` only when a value really changes.** Most values are set once. A `let` tells the reader "watch this one, it moves" (Days 1 and 8).
2. **Types are checked before the code runs.** `"early-bird" | "student" | "vip"` makes a typo a compile error instead of a wrong price at the door (Day 3).
3. **A return type is a promise the compiler checks.** `: number` means every path through the function returns a number, including the one you forgot (Day 5).
4. **Small functions, combined.** `monthsToAffordFromWeekly` is built from two functions you already trusted, not a copy of their logic (Day 10).
5. **Pass randomness in.** A function that takes a `random` parameter can be tested; one that calls `Math.random()` inside can't (Days 4 and 11).
6. **"Not found" is part of the type.** `find` returns `MenuItem | undefined`, and the compiler makes you deal with the `undefined` (Day 13).
7. **Read the error top to bottom.** `npm run typecheck` names the file, the line and the type. That's usually the whole answer (Day 12).
8. **Data and lookups.** `Record<string, Room>` and `world[roomId]` turn a game's map into data you can test, and a bad id throws a clear error (Day 14).

## Self-test

1. What's the difference between `string[]` and `[string, string]`?
2. Why does `Math.ceil` appear in the PS5 savings plan and the SMS caption fitter, and not `Math.round`?
3. Why does Day 13 import `./menu.ts` with the `.ts` on the end?
4. `room.isEnding` is `undefined` for most rooms. How do you get a real `true` or `false` from it?
5. When would you pick a `while` loop over `for...of`?

<details><summary>Answers</summary>

1. `string[]` is any number of strings. `[string, string]` is a tuple: exactly two, in that order, like a pair of players in a bracket.
2. Both round *up*. One shilling short in month 29 still means a 30th month, and 161 characters still needs a second SMS.
3. Node runs the TypeScript file directly, as it is, so the import names the real file.
4. `room.isEnding === true`.
5. When you don't know in advance how many times you'll loop, like guesses until someone gets the answer. `for...of` is for going through every item in a list.

</details>

## Build it without steps

**A matatu fare calculator.** Write `fare.ts` and `fare.test.ts` from scratch. Given a route and a time of day, it returns the fare: peak, off-peak or night prices, with a student discount, rounded up to the next 10 shillings. A route that doesn't exist throws an error that names it. Then add a function that prints a receipt with the items lined up using `padEnd`.

There are no steps and no starter. Decide the types first, write a test for each rule before the code, and stop when `npm test` and `npm run typecheck` both pass.
