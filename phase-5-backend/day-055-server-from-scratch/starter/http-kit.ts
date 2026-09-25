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
  // TODO: Content-Type must start with "application/json", or 415 "Send JSON, with Content-Type: application/json"
  // TODO: a Content-Length over the limit -> 413 `Body too large: the limit is <limit> bytes` straight away
  // TODO: read the chunks (for await ... of request), counting bytes as they arrive; over the limit -> the same 413
  //   (a sender can lie about Content-Length, so count what really arrives)
  // TODO: JSON.parse the whole thing; if it fails -> 400 "The body isn't valid JSON"
  throw new Error("not implemented yet");
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
    // TODO: split the path into parts. A route matches when it has the same number of parts, and each part is
    //   equal, or is a ":name" placeholder (then params.name = that part, decodeURIComponent-ed).
    // TODO: collect the method of every route that matches the path into `allowed`; the handler is the first
    //   match whose method is `method` (or null)
    throw new Error("not implemented yet");
  }
}
