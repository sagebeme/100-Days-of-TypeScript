import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";

// What middleware adds to each request, so handlers get it with types: c.get("requestId").
export type AppEnv = { Variables: { requestId: string } };

// Gives every request an id, and sends it back in X-Request-Id. When someone reports a problem,
// the id in their error message finds the exact line in your logs.
export function requestId(makeId: () => string = () => crypto.randomUUID()) {
  return createMiddleware<AppEnv>(async (c, next) => {
    // TODO: use the incoming X-Request-Id header if it's 1-64 letters, digits, _ or -; otherwise makeId()
    // TODO: c.set("requestId", id), send it back with c.header("X-Request-Id", id), then await next()
    await next();
  });
}

// Middleware wraps the handler: code before `await next()` runs on the way in, code after it on the way out.
export function logRequests(log: (line: string) => void) {
  return createMiddleware<AppEnv>(async (c, next) => {
    // TODO: time the request around `await next()`, then log
    //   "<requestId> <METHOD> <path> <status> <ms>ms" (the status is c.res.status, ms to 1 decimal place)
    await next();
  });
}

// One place that turns every error into the same JSON shape.
export function handleError(log: (line: string) => void) {
  return (error: Error, c: Context<AppEnv>) => {
    // TODO: an HTTPException -> c.json({ error: message, requestId }, its status)
    // TODO: anything else -> log "<requestId> Unexpected error: <stack>", and
    //   c.json({ error: "Something went wrong on our side", requestId }, 500)
    void HTTPException;
    void log;
    return c.json({ error: error.message }, 500);
  };
}
