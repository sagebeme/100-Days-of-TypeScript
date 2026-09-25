import type { Server } from "node:http";
import type { Logger } from "./logger.ts";

export interface ShutdownOptions {
  server: Server;
  timeoutMs: number; // how long to let requests in progress finish
  onClosed: () => Promise<void> | void; // close the database, flush logs...
  log: Logger;
}

// A deploy stops the old copy of your app with a signal (SIGTERM). Stopping at once would cut off
// people mid-request, like a matatu pulling off with someone half on board. Instead:
//   1. stop taking NEW requests (and tell the health check we're going, so traffic moves away),
//   2. let the ones in progress finish, up to a limit,
//   3. close the database, and exit.
export interface Shutdown {
  shutdown(reason: string): Promise<number>; // resolves to the exit code: 0 clean, 1 not
  isShuttingDown(): boolean;
}

export function gracefulShutdown(options: ShutdownOptions): Shutdown {
  // TODO: shutdown(reason) runs only once (every later call gets the same promise):
  //   1. mark shuttingDown = true, and log "Shutting down" with the reason
  //   2. server.close(...) (stops new connections; its callback runs when every connection is gone)
  //   3. closeIdleConnections() now AND every 50 ms while you wait: keep-alive connections that finish a
  //      request during the wait go idle, and close() would wait for them forever
  //   4. wait for close, or timeoutMs, whichever is first. On timeout: log a warning, closeAllConnections()
  //   5. run onClosed(). It throws -> log the error and return 1
  //   6. return 0 if it closed in time, 1 if it had to force it
  // TODO: return { shutdown, isShuttingDown }
  throw new Error("not implemented yet");
}
