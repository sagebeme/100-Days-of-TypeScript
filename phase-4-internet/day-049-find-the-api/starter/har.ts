import { z } from "zod";

// A HAR file is what the browser's Network tab saves ("Save all as HAR"): every request the page made.
const HarSchema = z.object({
  log: z.object({
    entries: z.array(
      z.object({
        request: z.object({ method: z.string(), url: z.string() }),
        response: z.object({
          status: z.number(),
          content: z.object({ mimeType: z.string().default(""), size: z.number().default(0) }),
        }),
        time: z.number().default(0),
      }),
    ),
  }),
});

export interface Endpoint {
  method: string;
  host: string;
  path: string; // with ids replaced: "/api/products/:id"
  query: string[]; // the parameter names seen, sorted
  calls: number;
  averageMs: number;
  exampleUrl: string;
}

// "/api/products/1234" and "/api/products/5678" are the same endpoint.
export function pathPattern(path: string): string {
  // TODO: replace each path segment that's all digits, or a UUID, with ":id"
  throw new Error("not implemented yet");
}

export function findJsonEndpoints(har: unknown): Endpoint[] {
  // TODO: parse with HarSchema, then keep only entries with status 200 and a mimeType containing "json"
  // TODO: group them by method + host + pathPattern(pathname). For each endpoint keep:
  //   calls, averageMs (the mean of entry.time, rounded), the query parameter names seen (sorted),
  //   and the first URL seen as exampleUrl
  // TODO: most-called first; ties by path, A to Z
  throw new Error("not implemented yet");
}

// Ready-to-paste code for trying an endpoint you found.
export function asFetchCode(endpoint: Endpoint): string {
  return [
    `const response = await fetch("${endpoint.exampleUrl}", {`,
    `  headers: { Accept: "application/json", "User-Agent": "YourApp/1.0 (you@example.com)" },`,
    `});`,
    `const data: unknown = await response.json(); // check it with a Zod schema (Day 44)`,
  ].join("\n");
}
