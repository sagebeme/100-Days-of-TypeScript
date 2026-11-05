# Day 92: Kiswahili Wordle (Neno)

*A brief and a test suite. No walkthrough.*

## The brief

Build **Neno**, a daily word game: guess the five-letter Kiswahili word in six tries. After each guess the letters turn green (right place), yellow (in the word, elsewhere) or grey (not in it). Everyone gets the same word each day, so people compare results in the group chat. And because it's Kiswahili, you learn the word's meaning at the end.

`words.ts` has the words and their meanings.

## The rules (tested)

- **Scoring, including repeated letters.** Mark the greens first, then give out yellows one per remaining copy of each letter in the answer. Guessing `mtoto` for `tumbo`: the last `o` is green, so the first `o` is grey (there's only one `o`), and only the first `t` is yellow.
- **The keyboard** shows the best thing known about each letter: green beats yellow beats grey.
- **Playing**: letters up to five, backspace, and Enter. Too short, or not a known word: a message in Kiswahili and English (`Herufi hazitoshi · Not enough letters`), and the turn isn't used. A win cheers by how quick it was; six misses end the game and show the word. Nothing changes after the end.
- **The daily word**: puzzle 1 was 1 January 2026, and a new puzzle starts at **midnight in Nairobi**, wherever the player is. Words come in a fixed shuffled order (not alphabetical), each once before any repeats.
- **Sharing**: `Neno #42 2/6` and the coloured squares, never the letters, so nothing's spoiled.
- **Stats**: played, won, the current and best streak (winning yesterday's puzzle too), and how many guesses each win took. A puzzle never counts twice.

## The page (yours to design)

The grid and an on-screen keyboard that works alongside the real one, tiles that flip, a row that shakes when a guess isn't accepted, and a result showing the meaning, stats and a Share button. Keep today's game and the stats in `localStorage`, so a reload carries on. Don't rely on colour alone: give the tiles accessible labels ("n, present").

## Steps

1. Read the tests, then `words.ts` (`ANSWERS` with their meanings, and `WORDS`, every guess allowed). `newGame` and `noStats` are already written.
2. `score` with the two passes, then `keyboard`. `npm test -- day-092 -t "scoring"`.
3. `play`: letters, back, enter, the two messages, winning and losing.
4. `puzzleNumber` and `answerFor`, then `shareText` and `record`.
5. Run the tests, then build the page in `main.ts` (the commands under "Done when").

## Done when

```bash
npm test -- day-092
npx vite phase-8-portfolio/day-092-kiswahili-wordle/starter
```

## Stretch

- A much bigger word list, so more real guesses are accepted.
- Hard mode: letters you've found must be used in later guesses.
- Sheng mode, with its own words.

## Check yourself

1. Predict the output: `score("mtoto", "tumbo")`
2. Predict the keyboard after that one guess: `keyboard(["mtoto"], "tumbo")`
3. Predict `puzzleNumber` at `2026-01-01T20:59:59Z` and at `2026-01-01T21:00:00Z`.
4. Why are the answers put in order by a shuffle with a fixed seed, instead of `Math.random()` or the word list's own order?

<details><summary>Answers</summary>

1. `["present", "present", "absent", "absent", "correct"]`. The last `o` is green, so there's no `o` left for the first one, and only one `t` can be yellow.
2. `{ m: "present", t: "present", o: "correct" }`: green beats yellow beats grey, so `o` shows green.
3. `1` and `2`. 21:00 UTC is midnight in Nairobi, so a new puzzle starts there, wherever the player is.
4. Everyone must get the same word on the same day, so it can't be random per player. And alphabetical order would let players guess what's coming next.

</details>

## When you're stuck

- **`mtoto` for `tumbo` gives too many yellows** — two passes. First mark the greens and count the answer's letters that *weren't* matched. Then go left to right: a letter is yellow only while its count is above 0, and each yellow takes one off.
- **A wrong guess uses up a turn** — on Enter, check the length and then `WORDS.has(current)` before adding it to `guesses`. Keep `current` as typed, so the player can fix it.
- **`A` or `1` is typed as is** — lowercase the letter first, then accept only `a` to `z`.
- **The puzzle changes at 03:00 in Nairobi** — Nairobi is UTC+3 all year. Add 3 hours to the time before you divide by a day's milliseconds, and count from 1 January 2026 as puzzle 1.
- **The answers come out alphabetically** — shuffle the list once with a fixed seed (a small random-number formula you write, not `Math.random`), so every player gets the same order. Then `(puzzle - 1) % count` picks the word.
- **A missed day keeps the streak going** — the streak carries on only when this puzzle is `lastPuzzle + 1`. The same puzzle again changes nothing.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
