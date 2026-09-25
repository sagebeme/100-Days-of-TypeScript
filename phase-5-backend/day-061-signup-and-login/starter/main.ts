// Already written: run the auth API.
//   node phase-5-backend/day-061-signup-and-login/starter/main.ts
// curl keeps cookies in a file with -c (save) and -b (send):
//   curl -c jar.txt -X POST localhost:3061/signup -H 'Content-Type: application/json' -d '{"email":"amina@example.com","name":"Amina","password":"matatu-sunset-42"}'
//   curl -b jar.txt localhost:3061/me
//   curl -b jar.txt -c jar.txt -X POST localhost:3061/logout
import { join } from "node:path";
import { serve } from "@hono/node-server";
import { openDatabase } from "./db.ts";
import { migrate, readMigrations } from "./migrate.ts";
import { createApp } from "./app.ts";

const database = openDatabase(join(import.meta.dirname, "auth.db"));
migrate(database.sqlite, readMigrations(join(import.meta.dirname, "migrations")));

// On http://localhost cookies can't be Secure (that needs HTTPS), so it's switched off here only.
const app = createApp({ db: database.db, secureCookies: process.env.NODE_ENV === "production" });
serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3061) }, (info) => console.log(`Auth API on http://localhost:${info.port}`));
