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
    .post("/vendors", validate("json", VendorInputSchema), (c) => {
      const vendor = repo.create(c.req.valid("json"));
      c.header("Location", `/vendors/${vendor.id}`);
      return c.json(vendor, 201);
    });
  // TODO: the other five routes from Day 57, each with validate(...) for its param (IdParamSchema)
  //   and body (VendorInputSchema for PUT, VendorPatchSchema for PATCH, ReviewSchema for reviews).
  //   Handlers read c.req.valid("param") / c.req.valid("json"), and throw problem(404, `No vendor <id>`)
  //   for an unknown id.
  void found;
  void VendorPatchSchema;
  void ReviewSchema;
  void IdParamSchema;

  app.notFound((c) => sendProblem(c, problem(404, `Nothing at ${c.req.path}`).problem));
  app.onError(handleErrors(log));
  return app;
}
