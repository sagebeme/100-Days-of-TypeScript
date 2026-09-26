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

## Done when

```bash
npm test -- day-092
npx vite phase-8-portfolio/day-092-kiswahili-wordle/starter
```

## Stretch

- A much bigger word list, so more real guesses are accepted.
- Hard mode: letters you've found must be used in later guesses.
- Sheng mode, with its own words.
