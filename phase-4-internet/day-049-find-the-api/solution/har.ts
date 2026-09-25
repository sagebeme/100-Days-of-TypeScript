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
  return path
    .split("/")
    .map((part) => (/^\d+$/.test(part) || /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(part) ? ":id" : part))
    .join("/");
}

export function findJsonEndpoints(har: unknown): Endpoint[] {
  const { entries } = HarSchema.parse(har).log;
  const found = new Map<string, Endpoint & { totalMs: number; params: Set<string> }>();

  for (const entry of entries) {
    if (entry.response.status !== 200 || !entry.response.content.mimeType.includes("json")) continue;
    const url = new URL(entry.request.url);
    const method = entry.request.method.toUpperCase();
    const path = pathPattern(url.pathname);
    const key = `${method} ${url.host}${path}`;

    const endpoint = found.get(key) ?? {
      method,
      host: url.host,
      path,
      query: [],
      calls: 0,
      averageMs: 0,
      exampleUrl: entry.request.url,
      totalMs: 0,
      params: new Set<string>(),
    };
    endpoint.calls++;
    endpoint.totalMs += entry.time;
    for (const name of url.searchParams.keys()) endpoint.params.add(name);
    found.set(key, endpoint);
  }

  return [...found.values()]
    .map(({ totalMs, params, ...endpoint }) => ({
      ...endpoint,
      query: [...params].sort(),
      averageMs: Math.round(totalMs / endpoint.calls),
    }))
    .sort((a, b) => b.calls - a.calls || a.path.localeCompare(b.path));
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
