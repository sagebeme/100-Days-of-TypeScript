// Already written: the street food API, now with shared schemas and Problem Details errors.
//   node phase-5-backend/day-058-validation-and-errors/starter/main.ts
//   curl -X POST localhost:3058/vendors -H 'Content-Type: application/json' -d '{"name":"","priceKes":-5}'
import { serve } from "@hono/node-server";
import { createApp } from "./app.ts";
import { createMemoryRepository } from "./vendors.ts";
import { SEED } from "./seed.ts";

const app = createApp(createMemoryRepository(SEED), console.error);
serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3058) }, (info) => {
  console.log(`Street food API on http://localhost:${info.port}/vendors`);
});
