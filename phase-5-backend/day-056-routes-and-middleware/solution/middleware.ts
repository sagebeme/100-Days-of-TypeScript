import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";

// What middleware adds to each request, so handlers get it with types: c.get("requestId").
export type AppEnv = { Variables: { requestId: string } };

// Gives every request an id, and sends it back in X-Request-Id. When someone reports a problem,
// the id in their error message finds the exact line in your logs.
export function requestId(makeId: () => string = () => crypto.randomUUID()) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const incoming = c.req.header("X-Request-Id");
    // Accept a sensible id from a proxy in front of you; otherwise make one.
    const id = incoming && /^[\w-]{1,64}$/.test(incoming) ? incoming : makeId();
    c.set("requestId", id);
    c.header("X-Request-Id", id);
    await next();
  });
}

// Middleware wraps the handler: code before `await next()` runs on the way in, code after it on the way out.
export function logRequests(log: (line: string) => void) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const started = performance.now();
    await next();
    const ms = (performance.now() - started).toFixed(1);
    log(`${c.get("requestId")} ${c.req.method} ${c.req.path} ${c.res.status} ${ms}ms`);
  });
}

// One place that turns every error into the same JSON shape.
export function handleError(log: (line: string) => void) {
  return (error: Error, c: Context<AppEnv>) => {
    const id = c.get("requestId");
    if (error instanceof HTTPException) {
      return c.json({ error: error.message, requestId: id }, error.status);
    }
    log(`${id} Unexpected error: ${error.stack ?? error.message}`);
    return c.json({ error: "Something went wrong on our side", requestId: id }, 500);
  };
}
