# Day 34: Kiswahili Flashcards That Remember You — localStorage

Watch the video: *(not recorded yet)*

## The brief

Build a flashcard app for Kiswahili words. It shows a word, you think of the English, you flip the card, and you say whether you got it. The clever part: it remembers. Words you know come back less and less often; words you miss come back tomorrow. Close the tab, come back next week, and your progress is still there.

This is the Leitner system, and it runs on three boxes:

| Box | You get it right | Comes back in |
| --- | --- | --- |
| new → 1 | first time right | 1 day |
| 1 → 2 | right again | 3 days |
| 2 → 3 | right again | 7 days ("learned") |
| any → 1 | **wrong** | today, at the end of this session |

```
review({}, "maji", true, "2026-10-01")   →  { maji: { box: 1, due: "2026-10-02" } }
review(p,  "maji", true, "2026-10-02")   →  { maji: { box: 2, due: "2026-10-05" } }
review(p,  "maji", false, "2026-10-05")  →  { maji: { box: 1, due: "2026-10-05" } }
```

## What you'll use

- `localStorage.getItem` / `setItem`: the browser's small, per-site key-value store. It keeps **strings only**, so you save with `JSON.stringify` and load with `JSON.parse`
- Treating stored data like fetched data: it can be missing, out of date or edited by hand in DevTools, so you check it before you trust it
- `try` / `catch` around both reading and writing. Private browsing and a full disk both make `localStorage` throw
- `Pick<Storage, "getItem">`: asking for only the part of `Storage` you use, which lets the tests pass in a fake

## Steps

1. Start the dev server and open DevTools → Application → Local Storage. You'll watch your progress appear there.

   ```bash
   npm run dev -- phase-3-browser/day-034-kiswahili-flashcards/starter
   ```

2. In `starter/deck.ts`:
   - `addDays(day, days)`: `"2026-10-01"` plus 3 is `"2026-10-04"`. Use UTC, like yesterday.
   - `review(progress, cardId, correct, today)`: returns a **new** map with that card moved to its new box and due date, using the table above. A card with no entry yet is "new".
   - `dueCards(cards, progress, today)`: the cards to study today. First the cards that are due (their `due` is today or earlier), lowest box first, then the new cards, each group in the order `cards` lists them. Cards due later are left out.
   - `learnedCount(progress)`: how many cards are in box 3.
   - `loadProgress(storage, key)`: read and parse. Missing, broken JSON, or not an object gives `{}`. Keep only the entries that look right: `box` a whole number from 1 to 3, `due` a string. If `getItem` throws, return `{}`.
   - `saveProgress(storage, key, progress)`: write it as JSON and return `true`. If `setItem` throws, return `false` instead of crashing.
3. In `starter/app.ts`, write `mountFlashcards(root, options)`:
   - Build the session's queue with `dueCards` once, when the app starts.
   - Showing a card: `#prompt` has the Kiswahili word, `#answer` has the English but is hidden, `#reveal` is visible and `#grade` (the two buttons) is hidden.
   - `#reveal` shows the answer and the grade buttons and hides itself.
   - `#right` / `#wrong` save the review, then move on. A wrong card goes to the back of the queue, so you see it again before you finish.
   - `#stats` always says `3 left · 5 learned`.
   - With nothing left, `#prompt` says `Umemaliza! Come back tomorrow.` and the answer, reveal and grade parts are all hidden.
4. Run the tests:

   ```bash
   npm test -- day-034
   ```

## When you're stuck

- **`[object Object]` in storage** — you saved the object itself. `localStorage` turns everything into a string; save `JSON.stringify(progress)`.
- **The app crashes after you edit the storage by hand** — `JSON.parse` throws on broken JSON. Wrap it in `try` / `catch`.
- **Progress resets every time** — check the key you save with is the same key you load with.
- **A wrong card never comes back** — push it onto the end of the queue before you move on.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
