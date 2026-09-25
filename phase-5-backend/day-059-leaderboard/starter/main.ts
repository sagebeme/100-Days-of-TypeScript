// Already written: run the leaderboard API with a database file that survives restarts.
//   node phase-5-backend/day-059-leaderboard/starter/main.ts
//   curl -X POST localhost:3059/games/rider-rush/scores -H 'Content-Type: application/json' -d '{"player":"Amina","points":42,"country":"KE"}'
//   curl localhost:3059/games/rider-rush/leaderboard
import { join } from "node:path";
import { serve } from "@hono/node-server";
import { openDatabase } from "./db.ts";
import { migrate, readMigrations } from "./migrate.ts";
import { createApp } from "./app.ts";

const database = openDatabase(join(import.meta.dirname, "leaderboard.db"));
const ran = migrate(database.sqlite, readMigrations(join(import.meta.dirname, "migrations")));
console.log(ran.length > 0 ? `Applied ${ran.join(", ")}` : "Database is up to date.");

const app = createApp(database.db);
const server = serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3059) }, (info) => {
  console.log(`Leaderboard on http://localhost:${info.port}/games/rider-rush/leaderboard`);
});
process.on("SIGINT", () =>
  server.close(() => {
    database.close();
    process.exit(0);
  }),
);
