import { validator } from "hono/validator";
import type { z } from "zod";
import { problem, fieldErrors } from "./problems.ts";

export type Target = "json" | "query" | "param";

// Checks one part of the request with a schema. The handler then reads the checked, typed value with
// c.req.valid("json") (or "query", "param"), and never sees anything that didn't pass.
export function validate<Schema extends z.ZodType, T extends Target>(target: T, schema: Schema) {
  return validator(target, (value, c) => {
    // Hono quietly treats a non-JSON body as {}. Say so instead.
    if (target === "json" && !c.req.header("Content-Type")?.startsWith("application/json")) {
      throw problem(415, "Send JSON, with Content-Type: application/json");
    }
    const result = schema.safeParse(value);
    if (!result.success) {
      throw problem(422, "Some fields need fixing", fieldErrors(result.error));
    }
    return result.data as z.output<Schema>;
  });
}
