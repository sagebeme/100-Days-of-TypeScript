# Day 39: Bao, Part 1 — a Tested Rules Engine

Watch the video: *(not recorded yet)*

## The brief

Bao is the mancala of the Swahili coast, played on a board of four rows of eight holes from Lamu to Zanzibar. Over the next two days you build a digital Bao board. Today there's no screen at all: you write the **rules engine**, the part that knows what a legal move is, what happens when you make one, and who has won. Tomorrow, a screen goes on top of it.

Keeping the rules apart from the screen means you can test every rule with a few numbers, without clicking anything. It also means the same engine could later run a terminal game, a web game or a computer opponent. By the end of today it runs the first of those.

We play a simplified Bao for learners. Full *Bao la Kiswahili* adds a phase where seeds are brought onto the board, a special "house" hole, and a choice of direction on every move. The core, sowing and capturing, is the same.

## The rules

Each player owns the two rows on their side: 16 holes, with 2 seeds in each at the start.

```
        column:  0  1  2  3  4  5  6  7
player 1 outer   8  9 10 11 12 13 14 15     (hole numbers from player 1's side)
player 1 inner   7  6  5  4  3  2  1  0
                 ------------------------
player 0 inner   0  1  2  3  4  5  6  7
player 0 outer  15 14 13 12 11 10  9  8
```

Holes 0–7 are your **inner row**, the one facing the opponent. Holes 8–15 are your **outer row**. Numbered like this, your 16 holes form a loop: after hole 15 comes hole 0 again.

1. **Pick** one of your holes with at least 2 seeds. Lift them all.
2. **Sow**: drop one seed in each of the following holes (hole + 1, hole + 2, …), staying on your own side.
3. Look at the hole where the **last** seed landed:
   - **It was empty** (it now has 1 seed): your move is over.
   - **It's in your inner row, and the opponent's hole facing it has seeds: capture.** Take every seed from that opponent hole and put them in the hole you landed in. Your move is over.
   - **Otherwise: relay.** Lift every seed from that hole and keep sowing them, starting from the next hole. Then look at where the last seed landed again.
4. In the rare case that a move relays round more than 200 times (`MAX_LAPS`), it stops there.

Why does a capture end the move? We tried the other way first: captured seeds that keep sowing. Two computer players who always grab the biggest capture played 1,000 games of each version. When captures kept going, the first player won 79% of the time and a game lasted 9 moves. With captures ending the move, it's 47% against 53% and games last about 40 moves. Testing a rule by playing it thousands of times is exactly what a separate rules engine makes possible.

Facing holes: your inner hole `h` faces the opponent's inner hole `7 − h`. Outer-row holes don't face anything, so they never capture.

**Winning**: after a move, if your opponent's inner row is empty, or they have no hole with 2 or more seeds, **you win**. Otherwise, if your own inner row is now empty, **they win**.

```
play(createBao(), 0).steps  →  [ { kind: "lift",    player: 0, hole: 0, seeds: 2 },
                                 { kind: "sow",     player: 0, hole: 1 },
                                 { kind: "sow",     player: 0, hole: 2 },
                                 { kind: "capture", player: 1, hole: 5, seeds: 2 },
                                 { kind: "end",     player: 0, hole: 2 } ]
```

## What you'll use

- A game state that's plain data: two arrays of numbers, whose turn it is, and the winner
- Pure functions: `play(state, hole)` returns a **new** state and never changes the old one. That's what makes "undo" and a computer opponent easy later
- A log of `Step`s, a discriminated union (Day 20) that records every lift, sow and capture in order. The engine doesn't animate anything, but tomorrow the screen replays these steps
- Modulo (`%`) to make a row of holes into a loop
- Invariant tests: whatever happens, there are always 64 seeds on the board

## Steps

1. Read `starter/bao.ts`. The types, `other`, `nextHole` and `formatBoard` are written for you.
2. `createBao()`: both sides full of `START_SEEDS`, player 0 to move, no winner.
3. `facingHole(hole)`: the opponent's hole facing an inner hole, or `null` for an outer hole.
4. `movesFor(side)`: the holes with 2 or more seeds, in order. `legalMoves(state)` is the same for whoever's turn it is, and `[]` once someone has won.
5. `innerRowEmpty(side)` and `seedsOn(side)`.
6. `play(state, hole)`. This is the big one. Write it in this order and run the tests after each part:
   - Throw `The game is over` if there's a winner, `No such hole: 16` for a hole that isn't a whole number from 0 to 15, and `Pick a hole with at least 2 seeds` if it has fewer.
   - Copy both sides so the old state never changes.
   - Lift and sow, recording a `lift` step and one `sow` step per seed.
   - The loop from step 3 of the rules: `end`, `capture` (then `end`), or `lift` and sow again.
   - Decide the winner, and pass the turn to the other player.
7. Run the tests:

   ```bash
   npm test -- day-039
   ```

8. Play a game in the terminal against a computer that picks moves at random:

   ```bash
   node phase-3-browser/day-039-bao-rules-engine/starter/cli.ts
   ```

## When you're stuck

- **Seeds appear or disappear** — the "always 64 seeds" test will catch it. Check that every seed you take out of a hole goes into your hand, and that every seed you sow comes out of it.
- **Your move sows onto the opponent's side** — in Bao you only ever sow on your own 16 holes. `mine[position] += 1`, never `theirs`.
- **The loop never ends** — you're checking for "landed in an empty hole" before adding the seed, or you're relaying out of an empty hole. After sowing, an empty hole has exactly 1 seed. And a capture must `break` out of the loop.
- **Captures happen from the outer row** — `facingHole` must return `null` for holes 8–15.
- **The first test passes but the old state changed** — `[...side]` copies one array. You need to copy both sides.
- **Still stuck?** Read `solution/bao.ts`, then close it and write your own from memory.
