# Day 59: Game High-Score Leaderboard — SQLite, Drizzle and Migrations

Watch the video: *(not recorded yet)*

## The brief

Every API so far forgot everything the moment it stopped. Today your data lives in a real **database**, so it survives restarts, crashes and deploys. And it's for your own games: Rider Rush and Bao (Phase 3) finally get an online leaderboard.

```
$ curl -X POST localhost:3059/games/rider-rush/scores -H 'Content-Type: application/json' -d '{"player":"Amina","points":42,"country":"KE"}'
{"playerId":1,"points":42,"rank":1,"best":42,"of":1}

$ curl localhost:3059/games/rider-rush/leaderboard
{"game":"rider-rush","entries":[
  {"rank":1,"player":"Amina","country":"KE","best":42,"games":3},
  {"rank":1,"player":"Baraka","country":"UG","best":42,"games":1},
  {"rank":3,"player":"Chebet","country":null,"best":7,"games":1}
]}
```

## What you'll use

- **SQLite**: a whole database in one file, built right into Node 24 (`node:sqlite`), with nothing to install
- **SQL** you can read: tables, columns, `PRIMARY KEY`, `UNIQUE`, `REFERENCES` (a score belongs to a player), `CHECK` (no negative scores), and an **index** so the leaderboard stays fast with a million scores
- **Drizzle**: a TypeScript layer over SQL. You write `db.select(...).from(scores).where(eq(scores.game, game))` and get typed results. It's still SQL underneath, so read the queries as SQL
- **Migrations**: the history of your database's shape, as numbered SQL files. Every copy of the app (your laptop, a teammate's, the server) runs the same files in the same order, so every database ends up the same
- **Aggregates**: `max(points)` and `count(...)` with `GROUP BY` turn "every score" into "each player's best"
- **Rank with ties**: two players on 30 are both first, and the next player is third

## Migrations, the rules

1. A migration that has run is **never edited**. To change something, write a new one. Your runner enforces this with a checksum of each file.
2. Each migration runs in a **transaction**: all of it, or none of it. A half-created table is worse than none.
3. The runner is **safe to run on every start-up**: it skips what's done.

Read the three files in `starter/migrations/`. The third one (`ALTER TABLE ... ADD COLUMN country`) is exactly the kind of change a real app makes months after launch.

## Steps

1. `starter/db.ts` and `starter/schema.ts` are written. Read them: `schema.ts` describes the same tables as the migrations, so Drizzle knows their types.
2. `starter/migrate.ts`: `readMigrations` and `migrate`.
3. `starter/leaderboard.ts`: `submitScore`, `leaderboard`, `standing` and `recentScores`.
4. Run the tests. Each one gets a fresh database in memory (`:memory:`), so tests never affect each other:

   ```bash
   npm test -- day-059
   ```

5. Run it for real. The database is `starter/leaderboard.db`. Stop the server, start it again, and the scores are still there:

   ```bash
   node phase-5-backend/day-059-leaderboard/starter/main.ts
   ```

## When you're stuck

- **`FOREIGN KEY constraint failed` never happens, even for a player that doesn't exist** — SQLite ignores `REFERENCES` unless `PRAGMA foreign_keys = ON` is set. `db.ts` does it; check you're using `openDatabase`.
- **"amina" and "Amina" become two players** — compare names with `COLLATE NOCASE`.
- **Everyone shows up with `games: 1`** — you grouped by score instead of by player.
- **`table players already exists`** — the migration ran before, but it wasn't recorded. Record it in the same transaction as the SQL.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
