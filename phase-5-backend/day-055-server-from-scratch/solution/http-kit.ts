import type { IncomingMessage, ServerResponse } from "node:http";

// An error that already knows its HTTP status. Throw it anywhere in a handler; the server turns it into a response.
export class HttpError extends Error {
  readonly status: number;
  readonly headers: Record<string, string>;

  constructor(status: number, message: string, headers: Record<string, string> = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.headers = headers;
  }
}

export function sendJson(response: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
  const text = JSON.stringify(body);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(text),
    ...headers,
  });
  response.end(text);
}

// Reads a JSON body, but never trusts the sender: the right content type, a size limit, valid JSON.
export async function readJson(request: IncomingMessage, limitBytes = 10_000): Promise<unknown> {
  const type = request.headers["content-type"] ?? "";
  if (!type.startsWith("application/json")) {
    throw new HttpError(415, "Send JSON, with Content-Type: application/json");
  }
  const declared = Number(request.headers["content-length"] ?? 0);
  if (declared > limitBytes) {
    throw new HttpError(413, `Body too large: the limit is ${limitBytes} bytes`);
  }

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += (chunk as Buffer).length;
    if (size > limitBytes) {
      throw new HttpError(413, `Body too large: the limit is ${limitBytes} bytes`);
    }
    chunks.push(chunk as Buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "The body isn't valid JSON");
  }
}

export interface Context {
  request: IncomingMessage;
  response: ServerResponse;
  url: URL;
  params: Record<string, string>;
}

export type Handler = (context: Context) => Promise<void> | void;

interface Route {
  method: string;
  parts: string[];
  handler: Handler;
}

// A tiny router: "/stages/:id" matches "/stages/46" with params { id: "46" }.
export class Router {
  readonly #routes: Route[] = [];

  on(method: string, pattern: string, handler: Handler): this {
    this.#routes.push({ method: method.toUpperCase(), parts: pattern.split("/").filter(Boolean), handler });
    return this;
  }

  // The handler for this method and path, and the methods the path allows (for a 405's Allow header).
  find(method: string, path: string): { handler: Handler | null; params: Record<string, string>; allowed: string[] } {
    const pathParts = path.split("/").filter(Boolean);
    const allowed: string[] = [];
    let found: { handler: Handler; params: Record<string, string> } | null = null;

    for (const route of this.#routes) {
      if (route.parts.length !== pathParts.length) continue;
      const params: Record<string, string> = {};
      const matches = route.parts.every((part, i) => {
        if (part.startsWith(":")) {
          params[part.slice(1)] = decodeURIComponent(pathParts[i]);
          return true;
        }
        return part === pathParts[i];
      });
      if (!matches) continue;
      allowed.push(route.method);
      if (route.method === method && found === null) found = { handler: route.handler, params };
    }
    return { handler: found?.handler ?? null, params: found?.params ?? {}, allowed };
  }
}
