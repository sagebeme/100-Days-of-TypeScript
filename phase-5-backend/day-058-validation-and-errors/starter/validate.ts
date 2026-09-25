import { validator } from "hono/validator";
import type { z } from "zod";
import { problem, fieldErrors } from "./problems.ts";

export type Target = "json" | "query" | "param";

// Checks one part of the request with a schema. The handler then reads the checked, typed value with
// c.req.valid("json") (or "query", "param"), and never sees anything that didn't pass.
export function validate<Schema extends z.ZodType, T extends Target>(target: T, schema: Schema) {
  return validator(target, (value, c) => {
    // TODO: for "json", a Content-Type that isn't application/json -> throw problem(415,
    //   "Send JSON, with Content-Type: application/json") (Hono would otherwise hand you {})
    // TODO: schema.safeParse(value); on failure throw problem(422, "Some fields need fixing", fieldErrors(...))
    // TODO: return the parsed data (as z.output<Schema>)
    void problem;
    void fieldErrors;
    void c;
    return schema.parse(value) as z.output<Schema>;
  });
}
