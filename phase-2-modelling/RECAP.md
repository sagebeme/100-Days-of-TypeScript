# Phase 2 Recap: Modelling with Types

Days 15–28. You stopped writing loose variables and started modelling things: songs, wallets, sneaker drops, deliveries, checkouts. It ended with a money tracker that saves to disk and survives a corrupted file.

## What this phase taught

How the project's tools fit together, how to describe data with interfaces, classes, generics and unions, how to handle errors you can predict, how to read files and untrusted data, and how to work test-first.

## Key ideas

1. **Know your machinery.** `tsconfig.json`, `package.json`, the lockfile and `node_modules` each have one job. A version range (`^`, `~`) says what may be installed; the lockfile says what was (Day 15).
2. **Keep state private, and copy instead of changing.** `#balanceCents` can't be touched from outside, and a method that returns a copy of its list can't be used to change it (Days 17 and 19).
3. **Money in whole cents.** `0.1 + 0.2` isn't `0.3` in JavaScript, so money is an integer (Day 17).
4. **Generics with constraints.** `Store<T extends { id: string }>` works for sneakers or anything else with an id, and the compiler still knows exactly what's inside (Day 19).
5. **Discriminated unions and `never`.** A shared `kind` field narrows each case in a `switch`, and a `never` check turns a forgotten case into a compile error (Day 20).
6. **Predictable errors are values.** A `Result<T, E>` says "this can fail, and here's how" in the type, and `catch` gives you `unknown` to check, not a guess (Day 21).
7. **Types vanish at runtime.** Anything from a file is `unknown` until a type guard (`value is Match`) has checked it. CSV from Excel has `\r\n` and empty cells (Days 22 and 24).
8. **Red, green, refactor.** A test you've never seen fail might not test anything. Write it first and watch it fail for the right reason (Day 25).

## Self-test

1. When is `extends` (inheritance) the right tool, and when is holding another object (composition) better?
2. What does `Partial<Pick<CreatorProfile, "handle" | "bio">>` mean in plain words?
3. Why does `await readFile(...)` need a `try`/`catch`, and which error should a ledger that's never been saved treat as normal?
4. Why write `const FARE = { peak: 120, offPeak: 80 } as const` instead of an `enum`?
5. `filter`, `map` or `reduce`: which one answers "total minutes per category"?

<details><summary>Answers</summary>

1. Inheritance when the new thing really *is* the old one with one behaviour changed (a reference book is a book that can't be lent). Composition when one thing *has* others (a library has books).
2. "Any of `handle` and `bio`, or neither": the fields someone may edit.
3. A missing file, bad JSON or no permission all reject the promise, and `await` turns that into a thrown error. A missing file just means "no ledger yet": return an empty one, and let every other error through.
4. Node strips types and runs what's left, and an `enum` needs generated code, so it doesn't run. `as const` plus `keyof typeof FARE` gives the same safety with a plain object.
5. `reduce`: it boils the list down to one value, here a `Record<Category, number>`.

</details>

## Build it without steps

**A chama (savings group) ledger.** Members pay in every month, and each month one member takes the pot. Model members, contributions and payouts with interfaces and a discriminated union of events. Keep money in cents. Save to a JSON file, check it with type guards when you load it, and report who's behind on payments and whose turn is next. Make a late payment a `Result` error, not a crash.

No steps and no starter: write the tests first, one rule at a time, and stop when `npm test` and `npm run typecheck` pass.
