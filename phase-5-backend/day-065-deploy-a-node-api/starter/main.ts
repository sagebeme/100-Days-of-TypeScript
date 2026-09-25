// Already written: how the pieces start up, and stop, in the right order.
//   node phase-5-backend/day-065-deploy-a-node-api/starter/main.ts
//   NODE_ENV=production node phase-5-backend/day-065-deploy-a-node-api/starter/main.ts   (see it refuse to start)
import { DatabaseSync } from "node:sqlite";
import { serve } from "@hono/node-server";
import type { Server } from "node:http";
import { loadConfig } from "./config.ts";
import { createLogger } from "./logger.ts";
import { createApp } from "./app.ts";
import { gracefulShutdown } from "./shutdown.ts";

let config;
try {
  config = loadConfig(process.env);
} catch (error) {
  // Fail fast, loudly, before listening: a half-configured server is worse than none.
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const log = createLogger({ level: config.logLevel });
const db = new DatabaseSync(config.databasePath);

let isShuttingDown = () => false;
const app = createApp({ config, db, log, isShuttingDown: () => isShuttingDown() });
const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  log.info("Listening", { port: info.port, environment: config.env });
}) as Server;

const stopper = gracefulShutdown({ server, timeoutMs: 10_000, onClosed: () => db.close(), log });
isShuttingDown = stopper.isShuttingDown;

// SIGTERM is what hosting platforms send before replacing your app; SIGINT is Ctrl+C.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, async () => process.exit(await stopper.shutdown(signal)));
}
// A bug that escaped everything else: log it, then stop cleanly rather than limp on.
process.on("uncaughtException", async (error) => {
  log.error("Uncaught exception", { error });
  process.exit((await stopper.shutdown("uncaughtException")) || 1);
});
