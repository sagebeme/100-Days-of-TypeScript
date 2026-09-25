# Day 60: Shared Playlists with Comments — Relations and Transactions

Watch the video: *(not recorded yet)*

## The brief

The road trip is on Saturday, and five friends are building the playlist together. Build the data layer for shared playlists:

- an **owner** shares a playlist with friends as **editors** (who can add, reorder and remove tracks) or **viewers** (who can only listen and comment);
- tracks sit in a strict **order** (1, 2, 3, …) that survives any reshuffle;
- anyone on the playlist can **comment**;
- and one call returns the **whole playlist**: owner, tracks in order with who added them, members, and the newest comments.

```ts
await share(database, roadTrip, amina, baraka, "editor");
await addTrack(database, roadTrip, baraka, gengetoneBanger);
await moveTrack(database, roadTrip, baraka, gengetoneBanger, 1); // straight to the top
await viewPlaylist(database, roadTrip, chebet);
// { name: "Road trip", owner: "Amina", totalSeconds: 650, tracks: [...], members: [...], comments: [...] }
```

## What you'll use

- **One-to-many**: a playlist has many comments, and each comment has a `playlist_id`
- **Many-to-many**: playlists ↔ tracks and playlists ↔ members. Neither side can hold a list of the other, so a **join table** (`playlist_tracks`, `playlist_members`) has one row per pairing, plus details about it (the position, who added it, the role)
- **Composite primary keys**: `(playlist_id, track_id)` makes "the same track twice" impossible at the database level
- **`ON DELETE CASCADE`**: delete a playlist and its tracks, members and comments go with it
- **Drizzle relations**: describe how tables connect once (`schema.ts`), then fetch nested data in one query with `with: { … }`
- **Transactions**: moving a track shifts several rows. If anything fails halfway, the whole move is undone, so the order is never left broken (`database.transaction(...)`)
- **Authorization in the data layer**: every function checks who's asking before it does anything

## Steps

1. Read `starter/migrations/0001_playlists.sql`, then `starter/schema.ts`. Sketch the tables and the lines between them on paper.
2. `starter/playlists.ts`: `createUser`, `createTrack`, `createPlaylist` and `playlistsFor` are written, as examples. Write the rest in order: `accessOf`, `share`, `addTrack`, `moveTrack`, `removeTrack`, `comment`, then `viewPlaylist`.
3. Run the tests:

   ```bash
   npm test -- day-060
   ```

## Moving a track, on paper

Tracks A B C D sit at 1 2 3 4. Move D (at 4) to 1: every track from position 1 up to 3 moves down one place, then D goes to 1. That gives D A B C. Moving A (at 1) to 3 is the mirror image: tracks from 2 up to 3 move up one place, then A goes to 3, giving B C A D. Draw it before you code it.

## When you're stuck

- **Two tracks end up at the same position** — you shifted the wrong range. Check `gte`/`lt` for moving up and `gt`/`lte` for moving down.
- **A failed move leaves the order broken** — the shifts must run inside `database.transaction(...)`, and the error must be thrown inside it so it rolls back.
- **`viewPlaylist` makes many queries** — use one `findFirst` with nested `with`; Drizzle turns it into a single SQL query.
- **Deleting a playlist fails with a foreign key error** — the migration needs `ON DELETE CASCADE` on every table that points at it.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
