import { Hono } from "hono";
import { VendorInputSchema, VendorPatchSchema, VendorQuerySchema, ReviewSchema, IdParamSchema } from "./schemas.ts";
import { validate } from "./validate.ts";
import { problem, handleErrors, sendProblem } from "./problems.ts";
import type { VendorRepository } from "./vendors.ts";

export function createApp(repo: VendorRepository, log?: (line: string) => void) {
  const found = <T>(value: T | undefined, id: string): T => {
    if (value === undefined) throw problem(404, `No vendor ${id}`);
    return value;
  };

  // Every route declares what it expects; the handlers only ever see checked, typed values.
  const app = new Hono()
    .get("/vendors", validate("query", VendorQuerySchema), (c) => {
      const query = c.req.valid("query");
      const page = repo.list(query);
      const nextOffset = query.offset + query.limit;
      const next = nextOffset < page.total ? `/vendors?${new URLSearchParams({ ...c.req.query(), offset: String(nextOffset) })}` : null;
      return c.json({ ...page, next });
    })
    .get("/vendors/:id", validate("param", IdParamSchema), (c) => {
      const { id } = c.req.valid("param");
      return c.json(found(repo.get(id), id));
    })
    .post("/vendors", validate("json", VendorInputSchema), (c) => {
      const vendor = repo.create(c.req.valid("json"));
      c.header("Location", `/vendors/${vendor.id}`);
      return c.json(vendor, 201);
    })
    .put("/vendors/:id", validate("param", IdParamSchema), validate("json", VendorInputSchema), (c) => {
      const { id } = c.req.valid("param");
      return c.json(found(repo.replace(id, c.req.valid("json")), id));
    })
    .patch("/vendors/:id", validate("param", IdParamSchema), validate("json", VendorPatchSchema), (c) => {
      const { id } = c.req.valid("param");
      return c.json(found(repo.update(id, c.req.valid("json")), id));
    })
    .delete("/vendors/:id", validate("param", IdParamSchema), (c) => {
      const { id } = c.req.valid("param");
      if (!repo.remove(id)) throw problem(404, `No vendor ${id}`);
      return c.body(null, 204);
    })
    .post("/vendors/:id/reviews", validate("param", IdParamSchema), validate("json", ReviewSchema), (c) => {
      const { id } = c.req.valid("param");
      return c.json(found(repo.review(id, c.req.valid("json").stars), id), 201);
    });

  app.notFound((c) => sendProblem(c, problem(404, `Nothing at ${c.req.path}`).problem));
  app.onError(handleErrors(log));
  return app;
}
