# Day 11: EA FC Tournament Night Bracket

Watch the video: *(not recorded yet)*

## The brief

Tournament night with the squad: shuffle the players, then pair them up for the first round.

```
createMatchups(["A", "B", "C", "D"], () => 0)  →  [["B", "C"], ["D", "A"]]
```

(That exact result only happens with a rigged `random` that always returns `0` — see below.)

## What you'll use

- **Tuples**: `[string, string]` is a *fixed-length, fixed-order* array type — always exactly two strings, unlike `string[]` which could be any length
- Shuffling an array in place with the Fisher-Yates algorithm, and — like Day 4 — an injectable `random` so the shuffle is testable

## Steps

1. Open `starter/fc-bracket.ts`. The `Matchup` tuple type is already defined.
2. Copy `players` into a new array called `shuffled`, so you don't mutate the array the caller passed in: `const shuffled = [...players]`.
3. Loop `i` from `shuffled.length - 1` down to `1` (a plain `for` loop, counting down).
4. Each iteration, pick `j = Math.floor(random() * (i + 1))`, then swap `shuffled[i]` and `shuffled[j]`.
5. After shuffling, walk through `shuffled` two at a time and push `[shuffled[i], shuffled[i + 1]]` tuples into a `matchups` array.
6. Return `matchups`.

```bash
npm test -- day-011
```

## Check yourself

1. What does the `Matchup` type `[string, string]` say that `string[]` doesn't?
2. Why copy `players` into `shuffled` before shuffling?
3. Predict the output: `createMatchups(["A", "B", "C"], () => 0)`
4. The shuffle loop stops at `i > 0`, not `i >= 0`. Why is skipping `i = 0` fine?

<details><summary>Answers</summary>

1. Exactly two strings, in that order. A `string[]` could be empty or have ten.
2. Swapping in place would reorder the caller's array behind their back. Copying keeps the function from changing what it was given.
3. `[["B", "C"], ["A", undefined]]`. With an odd number of players, the last one has no opponent, and `shuffled[i + 1]` reads past the end. The type says `string`, but the value is `undefined`: the type checker can't see this.
4. At `i = 0`, `j` can only be `0`, so the "swap" would swap an item with itself.

</details>

## When you're stuck

- **Your shuffle result doesn't match the test with `random: () => 0`** — walk through the algorithm by hand on paper with 4 players and `j` always `0`. Every swap should put `shuffled[i]` at position `0` and move whatever was at `0` up to position `i`.
- **"Type 'string[]' is not assignable to type 'Matchup'"** — a tuple isn't just "an array of 2 things" to the compiler unless you say so explicitly. Make sure `matchups` is typed `Matchup[]`, not left to infer as `string[][]`.
- **Still stuck?** Read `solution/fc-bracket.ts`, then close it and write your own from memory.
