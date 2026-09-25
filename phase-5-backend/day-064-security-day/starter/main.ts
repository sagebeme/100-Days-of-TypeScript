// Already written: run the (for now) vulnerable reviews API, and attack it yourself.
//   node phase-5-backend/day-064-security-day/starter/main.ts
//   curl "localhost:3064/reviews/search?q=%27%20OR%201%3D1%20--"         (HOLE 1: returns everything)
//   curl localhost:3064/debug                                             (HOLE 3: shows the secret)
//   open http://localhost:3064/reviews/page after posting a review with <b>bold</b> in it (HOLE 2)
import { serve } from "@hono/node-server";
import { openDb } from "./db.ts";
import { createApp } from "./app.ts";

// In a real app the secret comes from the environment (Day 45), never from the code.
const sessionSecret = process.env.SESSION_SECRET ?? "dev-only-secret-change-me-in-production";
const app = createApp({ db: openDb(), sessionSecret, log: console.error });
serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3064) }, (info) => console.log(`Reviews API on http://localhost:${info.port}`));
