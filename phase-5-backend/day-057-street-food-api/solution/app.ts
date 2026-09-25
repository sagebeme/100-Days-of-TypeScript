import { Hono, type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { VendorInput, VendorQuery, VendorRepository } from "./vendors.ts";

export const MAX_LIMIT = 50;

// Day 58 replaces these hand-written checks with Zod. For now: small, plain functions.
function number(value: unknown, field: string, check: (n: number) => boolean, rule: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || !check(value)) {
    throw new HTTPException(400, { message: `${field} must be ${rule}` });
  }
  return value;
}

function text(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HTTPException(400, { message: `${field} must be some text` });
  }
  return value.trim();
}

const CHECKS: { [K in keyof VendorInput]: (value: unknown) => VendorInput[K] } = {
  name: (v) => text(v, "name"),
  dish: (v) => text(v, "dish"),
  area: (v) => text(v, "area"),
  latitude: (v) => number(v, "latitude", (n) => n >= -90 && n <= 90, "between -90 and 90"),
  longitude: (v) => number(v, "longitude", (n) => n >= -180 && n <= 180, "between -180 and 180"),
  priceKes: (v) => number(v, "priceKes", (n) => Number.isInteger(n) && n > 0, "a whole number above 0"),
};

async function body(c: Context): Promise<Record<string, unknown>> {
  const data: unknown = await c.req.json().catch(() => null);
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new HTTPException(400, { message: "Send a JSON object" });
  }
  return data as Record<string, unknown>;
}

// Every field, for POST and PUT.
function fullInput(data: Record<string, unknown>): VendorInput {
  return {
    name: CHECKS.name(data.name),
    dish: CHECKS.dish(data.dish),
    area: CHECKS.area(data.area),
    latitude: CHECKS.latitude(data.latitude),
    longitude: CHECKS.longitude(data.longitude),
    priceKes: CHECKS.priceKes(data.priceKes),
  };
}

// Only the fields that were sent, for PATCH. Unknown fields are a mistake worth reporting.
function partialInput(data: Record<string, unknown>): Partial<VendorInput> {
  const changes: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!(key in CHECKS)) throw new HTTPException(400, { message: `${key} can't be changed` });
    changes[key] = CHECKS[key as keyof VendorInput](value);
  }
  if (Object.keys(changes).length === 0) throw new HTTPException(400, { message: "Send at least one field to change" });
  return changes as Partial<VendorInput>;
}

function query(c: Context): VendorQuery {
  const limit = Number(c.req.query("limit") ?? 10);
  const offset = Number(c.req.query("offset") ?? 0);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new HTTPException(400, { message: `limit must be from 1 to ${MAX_LIMIT}` });
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw new HTTPException(400, { message: "offset must be 0 or more" });
  }
  const maxPrice = c.req.query("maxPrice");
  const near = c.req.query("near");
  let nearPoint: VendorQuery["near"];
  if (near) {
    const [latitude, longitude] = near.split(",").map(Number);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new HTTPException(400, { message: "near must be latitude,longitude, like -1.2833,36.8167" });
    }
    nearPoint = { latitude, longitude };
  }
  const sort = c.req.query("sort");
  if (sort !== undefined && !["price", "rating", "distance", "name"].includes(sort)) {
    throw new HTTPException(400, { message: "sort must be price, rating, distance or name" });
  }
  if (sort === "distance" && !nearPoint) {
    throw new HTTPException(400, { message: "sort=distance needs near=latitude,longitude" });
  }
  return {
    area: c.req.query("area"),
    dish: c.req.query("dish"),
    maxPrice: maxPrice === undefined ? undefined : Number(maxPrice),
    near: nearPoint,
    sort: sort as VendorQuery["sort"],
    limit,
    offset,
  };
}

export function createApp(repo: VendorRepository) {
  const app = new Hono();
  const found = <T>(value: T | undefined, id: string): T => {
    if (value === undefined) throw new HTTPException(404, { message: `No vendor ${id}` });
    return value;
  };

  app.get("/vendors", (c) => {
    const q = query(c);
    const page = repo.list(q);
    // Tell the client where the next page is, so it never has to do the arithmetic.
    const nextOffset = q.offset + q.limit;
    const next = nextOffset < page.total ? `/vendors?${new URLSearchParams({ ...c.req.query(), offset: String(nextOffset) })}` : null;
    return c.json({ ...page, next });
  });
  app.get("/vendors/:id", (c) => c.json(found(repo.get(c.req.param("id")), c.req.param("id"))));
  app.post("/vendors", async (c) => {
    const vendor = repo.create(fullInput(await body(c)));
    c.header("Location", `/vendors/${vendor.id}`);
    return c.json(vendor, 201);
  });
  app.put("/vendors/:id", async (c) => c.json(found(repo.replace(c.req.param("id"), fullInput(await body(c))), c.req.param("id"))));
  app.patch("/vendors/:id", async (c) => c.json(found(repo.update(c.req.param("id"), partialInput(await body(c))), c.req.param("id"))));
  app.delete("/vendors/:id", (c) => {
    if (!repo.remove(c.req.param("id"))) throw new HTTPException(404, { message: `No vendor ${c.req.param("id")}` });
    return c.body(null, 204);
  });
  app.post("/vendors/:id/reviews", async (c) => {
    const data = await body(c);
    const stars = number(data.stars, "stars", (n) => Number.isInteger(n) && n >= 1 && n <= 5, "a whole number from 1 to 5");
    return c.json(found(repo.review(c.req.param("id"), stars), c.req.param("id")), 201);
  });

  app.notFound((c) => c.json({ error: `Nothing at ${c.req.path}` }, 404));
  app.onError((error, c) =>
    error instanceof HTTPException ? c.json({ error: error.message }, error.status) : c.json({ error: "Something went wrong on our side" }, 500),
  );
  return app;
}
