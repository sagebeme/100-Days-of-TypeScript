# Day 27: Fare Tables Without enum — `as const`

Watch the video: *(not recorded yet)*

## The brief

A matatu sacco needs a fare table: peak, off-peak and night fares, a way to look one up, and a way to total a day's rides. In many TypeScript tutorials this is where you'd reach for `enum`. Here you won't, and today you find out why by running the code.

```
fareFor("peak")                          →  120
totalFare(["peak", "offPeak", "night"])  →  350
isFareKind("night")                      →  true
isFareKind("weekend")                    →  false
```

## What you'll use

- **`as const`**: freezes an object's type to its exact values. `{ peak: 120 } as const` has the type `{ readonly peak: 120 }`, where `120` is the literal type, not just any `number`
- **`keyof typeof FARE`**: builds the union `"peak" | "offPeak" | "night"` from the object's keys, so you never write the list twice
- **`(typeof FARE)[FareKind]`**: builds the union of the values, `120 | 80 | 150`
- A type guard again (`value is FareKind`)

## Why not `enum`?

Node runs your `.ts` files by **erasing the type annotations** and running what's left. That works because types have no runtime meaning. An `enum` is different: it's a type *and* it generates a real object at runtime, so there's nothing to simply erase. Plain Node refuses it:

```
enum Fare { Peak = 120, OffPeak = 80 }
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript enum is not supported in strip-only mode
```

The test today proves it: it writes a file containing an `enum`, runs it with the real `node` program, and checks that Node rejects it. Then it runs *your* module the same way, so your code has to work under plain Node too.

A plain object with `as const` gives you nearly everything an enum did: named values, autocomplete, a union type. It is ordinary JavaScript, so Node runs it with no help.

## Steps

1. Open `starter/fares.ts`. `FARE` is written but it's missing something, and `FareKind` and `Fare` are derived from it.
2. Add `as const` to the end of the `FARE` object. Then run `npm run typecheck`: the type-level checks in the test file (`expectTypeOf`) only pass once `FARE` is `as const`, because without it `FARE.peak` is just `number`.
3. Write `fareFor(kind)`: return `FARE[kind]`.
4. Write `totalFare(rides)`: add up the fare of every ride.
5. Write `isFareKind(value)`: `true` if the string is one of the keys of `FARE`. Use `Object.hasOwn(FARE, value)`. (Not `value in FARE`: that also says yes to inherited names like `"toString"`.)
6. Run the tests and the type checker:

   ```bash
   npm test -- day-027
   npm run typecheck
   ```

7. **Try it yourself.** Create a scratch file anywhere with `enum Fare { Peak = 120 }` in it and run `node scratch.ts`. Read the error, then delete the file.

## When you're stuck

- **`npm run typecheck` says `number` is not `120`** — `FARE` is missing `as const`.
- **The Node test fails with `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` on *your* file** — something in `starter/fares.ts` isn't erasable. `enum` is the usual cause, and so are constructor parameter properties (`constructor(private x: string)`). Rewrite it with plain syntax.
- **`isFareKind("toString")` returns true** — you used `in`. Switch to `Object.hasOwn`.
- **Still stuck?** Read `solution/fares.ts`, then close it and write your own from memory.
