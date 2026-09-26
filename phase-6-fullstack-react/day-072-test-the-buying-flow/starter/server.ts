import { createServer, type ViteDevServer } from "vite";
import { join } from "node:path";

// Already written: starts the app (Vite dev server and the test API) on a free port, for the tests.
//   node phase-6-fullstack-react/day-072-test-the-buying-flow/starter/server.ts   (to look at it yourself)
export interface RunningApp {
  url: string; // "http://localhost:51234/"
  control(path: string, body?: unknown): Promise<void>; // POST to one of the /__test/ endpoints
  close(): Promise<void>;
}

export async function startApp(): Promise<RunningApp> {
  const root = join(import.meta.dirname, "app");
  const vite: ViteDevServer = await createServer({
    root,
    configFile: join(root, "vite.config.ts"),
    server: { port: 0, strictPort: false, host: "127.0.0.1" },
    logLevel: "error",
    clearScreen: false,
  });
  await vite.listen();
  const address = vite.httpServer?.address();
  if (!address || typeof address === "string") throw new Error("The app didn't start");
  const url = `http://127.0.0.1:${address.port}/`;
  return {
    url,
    async control(path, body) {
      const response = await fetch(new URL(`__test/${path}`, url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`__test/${path} answered ${response.status}`);
    },
    close: () => vite.close(),
  };
}

if (import.meta.main) {
  const app = await startApp();
  console.log(`The app, with the test API, is on ${app.url}`);
}
