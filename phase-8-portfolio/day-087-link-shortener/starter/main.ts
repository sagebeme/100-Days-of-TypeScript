// Already written: run the shortener.
//   node phase-8-portfolio/day-087-link-shortener/starter/main.ts
import { serve } from "@hono/node-server";
import { join } from "node:path";
import { openLinks } from "./links.ts";
import { createApp } from "./app.ts";

const port = Number(process.env.PORT ?? 3087);
const db = openLinks(process.env.DATABASE_PATH ?? join(import.meta.dirname, "links.db"));
const app = createApp({ db, baseUrl: process.env.BASE_URL ?? `http://localhost:${port}` });
serve({ fetch: app.fetch, port }, (info) => console.log(`Fupi on http://localhost:${info.port}`));
