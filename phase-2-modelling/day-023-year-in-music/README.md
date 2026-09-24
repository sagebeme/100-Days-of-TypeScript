# Day 23: Your Year in Music — async/await and Files

Watch the video: *(not recorded yet)*

## The brief

Every December your music app tells you your top artists and how many minutes you listened. You'll build a small "Wrapped" generator: read a JSON file of plays, work out the summary, and write it to another JSON file. This is your first program that has to *wait* for something outside your code, the disk, so it's your first taste of `async` and `await`.

Input file (`plays.json`):

```json
[
  { "track": "Melanin", "artist": "Sauti Sol", "msPlayed": 180000 },
  { "track": "Nyar Kanyada", "artist": "Nyashinski", "msPlayed": 300000 }
]
```

Output (`wrapped.json`):

```json
{
  "totalMinutes": 8,
  "topArtists": [
    { "artist": "Nyashinski", "minutes": 5 },
    { "artist": "Sauti Sol", "minutes": 3 }
  ]
}
```

## What you'll use

- `async function` and `await`: an `async` function always returns a **Promise**; `await` pauses until that Promise is done
- `readFile` and `writeFile` from `node:fs/promises`, the Promise version of Node's file API
- `JSON.parse` and `JSON.stringify`
- A `Map` to add up milliseconds per artist, then sorting the results
- What happens when a Promise **rejects** (file missing, bad JSON). `await` turns that into a thrown error you can catch

## Steps

1. Open `starter/wrapped.ts`. The `Play`, `ArtistTotal` and `Wrapped` types are written, and the `node:fs/promises` import is ready.
2. Write `loadPlays(path)`: `await readFile(path, "utf8")`, then `JSON.parse` the text. Don't catch errors here: a missing file or invalid JSON should reject the Promise so the caller finds out.
3. Write `buildWrapped(plays, topCount = 3)`. This one is *not* async, it's a plain calculation:
   - Add up `msPlayed` per artist in a `Map`.
   - Sort artists by total time, highest first. If two tie, sort by artist name A to Z.
   - `topArtists` is the first `topCount` of them, with time converted to minutes (`Math.round(ms / 60000)`).
   - `totalMinutes` is all the plays added together, converted the same way. Add up the milliseconds *first*, then convert, so rounding doesn't pile up.
4. Write `createWrapped(inputPath, outputPath, topCount = 3)`: `await` your `loadPlays`, call `buildWrapped`, `await writeFile(outputPath, JSON.stringify(wrapped, null, 2))`, and return the summary.
5. Run the tests. They create real temporary files, so this is a real disk round trip:

   ```bash
   npm test -- day-023
   ```

## When you're stuck

- **You get a Promise instead of a value** — you forgot `await`. Printing a Promise shows `Promise { <pending> }`.
- **"await is only valid in async functions"** — put `async` before `function`, and make sure the *caller* also awaits the result.
- **Tests say "expected to reject" but it resolved** — you caught the error inside `loadPlays` and swallowed it. Let it through.
- **Ties come out in the wrong order** — the sort needs a second rule for equal times. Compare `b.ms - a.ms` first, and if that's `0`, `a.artist.localeCompare(b.artist)`.
- **Still stuck?** Read `solution/wrapped.ts`, then close it and write your own from memory.
