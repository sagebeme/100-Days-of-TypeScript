# Day 16: Playlist Builder — Interfaces

Watch the video: *(not recorded yet)*

## The brief

You're building the data model for a music app. A `Song` has a title, an artist, and a length in seconds. A `Playlist` has a name and a list of songs. Then the small functions that make a playlist useful: how long is it, how do I show that length, and how do I add a song without wrecking the original.

```
formatDuration(585)  →  "9:45"
formatDuration(61)   →  "1:01"
totalDuration(matatuMix)  →  total seconds of every song in it
addSong(playlist, song)  →  a NEW playlist with the song added; the old one is untouched
```

## What you'll use

- `interface`: a named shape for an object (`Song`, `Playlist`). For everyday object shapes it works like the `type` aliases you've already written.
- Interfaces inside interfaces: `Playlist` holds a `Song[]`
- `padStart` for the seconds (`"1:01"`, not `"1:1"`)
- Spread (`...`) to copy an object or an array without mutating the original

## Steps

1. Open `starter/playlist.ts`. The `Song` and `Playlist` interfaces are already written. Read them.
2. Write `totalDuration(playlist)`: add up `durationSeconds` across every song. A `for...of` loop works, and so does `reduce` if you already know it.
3. Write `formatDuration(totalSeconds)`. Minutes are `Math.floor(totalSeconds / 60)`, seconds are `totalSeconds % 60`. Pad the seconds to two digits with `String(seconds).padStart(2, "0")`. Minutes don't wrap into hours: `3600` is `"60:00"`.
4. Write `addSong(playlist, song)`. Return a *new* object: `{ ...playlist, songs: [...playlist.songs, song] }`. Don't call `push` on the original.
5. Run the tests:

   ```bash
   npm test -- day-016
   ```

## When you're stuck

- **`"9:5"` instead of `"9:05"`** — you forgot `padStart`. It's a string method, so convert the number first with `String(...)`.
- **The "does not change the original" test fails** — `push` mutates. Build a new array with `[...playlist.songs, song]`.
- **What's the difference between `interface` and `type`?** For objects, very little day to day. Interfaces are the convention for object shapes and can be extended; `type` can also name unions like `"a" | "b"`. Use whichever the code around you already uses.
- **Still stuck?** Read `solution/playlist.ts`, then close it and write your own from memory.
