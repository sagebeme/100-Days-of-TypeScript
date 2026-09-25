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
  let started: Promise<number> | null = null;
  let shuttingDown = false;

  function shutdown(reason: string): Promise<number> {
    started ??= (async () => {
      shuttingDown = true;
      options.log.info("Shutting down", { reason, timeoutMs: options.timeoutMs });

      const closed = new Promise<void>((resolve) => options.server.close(() => resolve()));
      // Browsers keep connections open after a request ("keep-alive"). Close them as soon as they go
      // quiet, including the ones that finish a request while we wait, or close() would wait forever.
      options.server.closeIdleConnections();
      const sweeper = setInterval(() => options.server.closeIdleConnections(), 50);
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timedOut = new Promise<"timeout">((resolve) => {
        timer = setTimeout(() => resolve("timeout"), options.timeoutMs);
      });

      const outcome = await Promise.race([closed.then(() => "closed" as const), timedOut]);
      clearTimeout(timer);
      clearInterval(sweeper);
      if (outcome === "timeout") {
        options.log.warn("Requests still running after the timeout: closing them");
        options.server.closeAllConnections();
        await closed;
      }
      try {
        await options.onClosed();
      } catch (error) {
        options.log.error("Cleanup failed", { error });
        return 1;
      }
      options.log.info("Stopped cleanly");
      return outcome === "timeout" ? 1 : 0;
    })();
    return started;
  }

  return { shutdown, isShuttingDown: () => shuttingDown };
}
