// Already written: serves the practice site in site/ on a local port.
//   node phase-4-internet/day-051-browser-automation/starter/serve.ts   (then open http://localhost:5151)
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

export function createSiteServer(root = join(import.meta.dirname, "site")): Server {
  return createServer(async (request, response) => {
    const path = new URL(request.url ?? "/", "http://localhost").pathname;
    const file = normalize(join(root, path === "/" ? "index.html" : path));
    if (!file.startsWith(root)) {
      response.writeHead(403).end(); // no escaping the site folder with ../
      return;
    }
    try {
      const body = await readFile(file);
      response.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
      response.end(body);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
    }
  });
}

if (import.meta.main) {
  createSiteServer().listen(5151, () => console.log("Practice site on http://localhost:5151"));
}
