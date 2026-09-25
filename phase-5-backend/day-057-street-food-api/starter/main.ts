// Already written: run the street food API.
//   node phase-5-backend/day-057-street-food-api/starter/main.ts
//   curl "localhost:3057/vendors?near=-1.2833,36.8167&maxPrice=100"
//   curl -X POST localhost:3057/vendors/cbd-githeri/reviews -H 'Content-Type: application/json' -d '{"stars":5}'
import { serve } from "@hono/node-server";
import { createApp } from "./app.ts";
import { createMemoryRepository } from "./vendors.ts";
import { SEED } from "./seed.ts";

const app = createApp(createMemoryRepository(SEED));
serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3057) }, (info) => {
  console.log(`Street food API on http://localhost:${info.port}/vendors`);
});
