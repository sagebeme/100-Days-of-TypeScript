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

## Check yourself

1. Why `String(seconds).padStart(2, "0")`? What would `formatDuration(61)` print without it?
2. Predict the output: `formatDuration(59)` and `formatDuration(3600)`
3. Spot the bug:
   ```ts
   export function addSong(playlist: Playlist, song: Song): Playlist {
     playlist.songs.push(song);
     return playlist;
   }
   ```
4. Predict the output:
   ```ts
   const a: Playlist = { name: "Mix", songs: [] };
   const b = { ...a };
   b.songs.push({ title: "Melanin", artist: "Sauti Sol", durationSeconds: 200 });
   console.log(a.songs.length);
   ```

<details><summary>Answers</summary>

1. So one-digit seconds get a leading zero. Without it, 61 seconds prints `"1:1"`, which reads as one minute and one *tenth*.
2. `"0:59"` and `"60:00"`. Minutes don't roll over into hours.
3. It changes the playlist it was given. Any other code holding the original now sees the extra song too. Return a new object instead: `{ ...playlist, songs: [...playlist.songs, song] }`.
4. `1`. Spread is a *shallow* copy: `b.songs` is the very same array as `a.songs`. That's why `addSong` spreads the `songs` array as well as the playlist.

</details>

## When you're stuck

- **`"9:5"` instead of `"9:05"`** — you forgot `padStart`. It's a string method, so convert the number first with `String(...)`.
- **The "does not change the original" test fails** — `push` mutates. Build a new array with `[...playlist.songs, song]`.
- **What's the difference between `interface` and `type`?** For objects, very little day to day. Interfaces are the convention for object shapes and can be extended; `type` can also name unions like `"a" | "b"`. Use whichever the code around you already uses.
- **Still stuck?** Read `solution/playlist.ts`, then close it and write your own from memory.
