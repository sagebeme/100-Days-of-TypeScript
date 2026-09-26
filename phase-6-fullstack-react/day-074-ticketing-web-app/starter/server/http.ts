import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import { z } from "zod";

// Already written: the small helpers every route file uses.

// Reads and checks a JSON body. A body that isn't JSON, or doesn't fit, is a 422 with the reasons.
export async function readBody<S extends z.ZodType>(c: Context, schema: S): Promise<z.output<S>> {
  const result = schema.safeParse(await c.req.json().catch(() => null));
  if (!result.success) {
    throw new HTTPException(422, { message: result.error.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message)).join("; ") });
  }
  return result.data;
}

// "/events/abc" or "/events/0" is a 404, the same as an id that doesn't exist.
export function idParam(c: Context, name = "id"): number {
  const id = Number(c.req.param(name));
  if (!Number.isSafeInteger(id) || id < 1) throw new HTTPException(404, { message: "Not found" });
  return id;
}

export function fail(status: 400 | 401 | 403 | 404 | 409 | 422 | 502, message: string): never {
  throw new HTTPException(status, { message });
}

export function onError(error: Error, c: Context) {
  if (error instanceof HTTPException) return c.json({ error: error.message }, error.status);
  console.error(error);
  return c.json({ error: "Something went wrong on our side" }, 500);
}
