import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { VendorInputSchema, VendorPatchSchema, VendorQuerySchema } from "./starter/schemas.ts";
import { problem, fieldErrors, handleErrors } from "./starter/problems.ts";
import { validate } from "./starter/validate.ts";
import { createApp } from "./starter/app.ts";
import { checkVendorForm } from "./starter/form.ts";
import { createMemoryRepository } from "./starter/vendors.ts";
import { SEED } from "./starter/seed.ts";

const good = { name: "Tom Mboya Mahindi Choma", dish: "mahindi choma", area: "CBD", latitude: -1.2839, longitude: 36.8262, priceKes: 40 };

describe("the shared schemas", () => {
  it("accept a good vendor and tidy the text", () => {
    expect(VendorInputSchema.parse({ ...good, name: "  Tom Mboya Mahindi Choma " })).toEqual(good);
  });

  it("explain each bad field", () => {
    const result = VendorInputSchema.safeParse({ ...good, name: "", priceKes: 40.5, latitude: "north" });
    expect(result.success).toBe(false);
    expect(fieldErrors(result.error!)).toEqual([
      { field: "name", message: "name can't be empty" },
      { field: "latitude", message: "latitude must be a number" },
      { field: "priceKes", message: "priceKes must be whole shillings" },
    ]);
  });

  it("let PATCH send some fields, but not unknown ones or none", () => {
    expect(VendorPatchSchema.parse({ priceKes: 90 })).toEqual({ priceKes: 90 });
    expect(VendorPatchSchema.safeParse({ prize: 90 }).success).toBe(false);
    expect(VendorPatchSchema.safeParse({}).error?.issues[0].message).toBe("Send at least one field to change");
  });

  it("turn a query string into typed values", () => {
    expect(VendorQuerySchema.parse({ maxPrice: "100", near: "-1.28,36.81", limit: "5" })).toEqual({
      maxPrice: 100,
      near: { latitude: -1.28, longitude: 36.81 },
      limit: 5,
      offset: 0,
    });
    expect(VendorQuerySchema.parse({})).toEqual({ limit: 10, offset: 0 });
    expect(VendorQuerySchema.safeParse({ sort: "distance" }).error?.issues[0]).toMatchObject({ path: ["sort"], message: "sort=distance needs near" });
  });
});

describe("problems", () => {
  it("builds Problem Details with a title for the status", () => {
    expect(problem(404, "No vendor x").problem).toEqual({ type: "about:blank", title: "Not found", status: 404, detail: "No vendor x" });
    expect(problem(422, "Some fields need fixing", [{ field: "name", message: "name is required" }]).problem).toEqual({
      type: "https://docs.example/problems/validation",
      title: "Validation failed",
      status: 422,
      detail: "Some fields need fixing",
      errors: [{ field: "name", message: "name is required" }],
    });
  });

  it("turns every kind of error into a problem+json response, and hides bugs", async () => {
    const logs: string[] = [];
    const app = new Hono()
      .get("/known", () => {
        throw problem(404, "No such thing");
      })
      .get("/bug", () => {
        throw new Error("secret stack details");
      });
    app.onError(handleErrors((line) => logs.push(line)));

    const known = await app.request("/known");
    expect(known.status).toBe(404);
    expect(known.headers.get("Content-Type")).toBe("application/problem+json");
    expect(await known.json()).toEqual({ type: "about:blank", title: "Not found", status: 404, detail: "No such thing" });

    const bug = await app.request("/bug");
    expect(bug.status).toBe(500);
    expect(await bug.text()).not.toContain("secret");
    expect(logs[0]).toContain("secret stack details");
  });
});

describe("validate middleware", () => {
  const app = new Hono()
    .post("/echo", validate("json", VendorInputSchema), (c) => c.json(c.req.valid("json")))
    .get("/search", validate("query", VendorQuerySchema), (c) => c.json(c.req.valid("query")));
  app.onError(handleErrors());

  it("hands the handler clean, typed data", async () => {
    const response = await app.request("/echo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...good, name: " x " }) });
    expect(await response.json()).toEqual({ ...good, name: "x" });
    expect(await (await app.request("/search?limit=3")).json()).toEqual({ limit: 3, offset: 0 });
  });

  it("answers 422 with every field problem", async () => {
    const response = await app.request("/echo", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.title).toBe("Validation failed");
    expect(body.errors.map((e: { field: string }) => e.field)).toEqual(["name", "dish", "area", "latitude", "longitude", "priceKes"]);
  });

  it("refuses a body that isn't JSON with 415, instead of pretending it was empty", async () => {
    const response = await app.request("/echo", { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(good) });
    expect(response.status).toBe(415);
    expect((await response.json()).detail).toBe("Send JSON, with Content-Type: application/json");
  });

  it("answers 400 for broken JSON", async () => {
    const response = await app.request("/echo", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{oops" });
    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe("application/problem+json");
  });
});

describe("the API with shared schemas", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    let n = 0;
    app = createApp(createMemoryRepository(SEED, () => `new-${++n}`));
  });

  const send = (method: string, body: unknown) => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  it("still does everything Day 57 did", async () => {
    expect((await app.request("/vendors?maxPrice=50")).status).toBe(200);
    const created = await app.request("/vendors", send("POST", good));
    expect(created.status).toBe(201);
    expect(created.headers.get("Location")).toBe("/vendors/new-1");
    expect((await (await app.request("/vendors/new-1", send("PATCH", { priceKes: 45 }))).json()).priceKes).toBe(45);
    expect((await app.request("/vendors/new-1/reviews", send("POST", { stars: 5 }))).status).toBe(201);
    expect((await app.request("/vendors/new-1", { method: "DELETE" })).status).toBe(204);
  });

  it("reports every problem in one response", async () => {
    const response = await app.request("/vendors", send("POST", { ...good, name: "", priceKes: -5 }));
    expect(response.status).toBe(422);
    expect((await response.json()).errors).toEqual([
      { field: "name", message: "name can't be empty" },
      { field: "priceKes", message: "priceKes must be above 0" },
    ]);
  });

  it("checks the query string and the path too", async () => {
    const query = await app.request("/vendors?limit=500&sort=vibes");
    expect(query.status).toBe(422);
    expect((await query.json()).errors.map((e: { field: string }) => e.field)).toEqual(["sort", "limit"]);
    expect((await app.request("/vendors/NOT%20AN%20ID")).status).toBe(422);
  });

  it("answers unknown vendors and paths with problems", async () => {
    const vendor = await app.request("/vendors/nope");
    expect(vendor.status).toBe(404);
    expect(await vendor.json()).toEqual({ type: "about:blank", title: "Not found", status: 404, detail: "No vendor nope" });
    const path = await app.request("/buses");
    expect((await path.json()).detail).toBe("Nothing at /buses");
  });

  it("refuses a PATCH with a typo instead of ignoring it", async () => {
    const response = await app.request("/vendors/cbd-githeri", send("PATCH", { prize: 90 }));
    expect(response.status).toBe(422);
  });
});

describe("a form using the same schema", () => {
  it("accepts form text and converts numbers", () => {
    expect(checkVendorForm({ ...good, latitude: "-1.2839", longitude: "36.8262", priceKes: "40" })).toEqual({ ok: true, value: good });
  });

  it("gives one message per field, the same messages the server sends", () => {
    expect(checkVendorForm({ name: "", dish: "chips", area: "CBD", latitude: "", longitude: "36.8", priceKes: "40.5" })).toEqual({
      ok: false,
      errors: {
        name: "name can't be empty",
        latitude: "latitude must be a number",
        priceKes: "priceKes must be whole shillings",
      },
    });
  });
});
