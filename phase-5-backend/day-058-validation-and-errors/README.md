# Day 58: Validation and Error Middleware — Shared Zod Schemas

Watch the video: *(not recorded yet)*

## The brief

Yesterday's API checked its input with hand-written functions, stopped at the first problem, and answered every error in its own home-made shape. Today you fix all three:

1. **Schemas as the single source of truth.** The rules for a vendor live in one Zod schema. The server checks requests with it; in Phase 6 the web app will check its forms with the *same* schema, so the browser and the server can never disagree about what's valid.
2. **Middleware that validates.** Each route declares what it expects (`validate("json", VendorInputSchema)`), and the handler only ever sees clean, typed data.
3. **One error format for everything**, the web standard for API errors: **Problem Details** (RFC 9457), served as `application/problem+json`, with every field problem listed at once.

```
$ curl -X POST localhost:3058/vendors -H 'Content-Type: application/json' -d '{"name":"","priceKes":-5}'
{
  "type": "https://docs.example/problems/validation",
  "title": "Validation failed",
  "status": 422,
  "detail": "Some fields need fixing",
  "errors": [
    { "field": "name", "message": "name can't be empty" },
    { "field": "dish", "message": "dish is required" },
    ...
    { "field": "priceKes", "message": "priceKes must be above 0" }
  ]
}
```

## What you'll use

- **Zod schemas for every input**: the body (`json`), the query string (`query`, where everything arrives as text and numbers are coerced) and the path (`param`)
- **`.partial().strict().refine()`** for PATCH: any field, at least one, and a typo is an error, not silently ignored
- **Hono's `validator`**, wrapped in your own `validate(target, schema)`, and **`c.req.valid("json")`**, which is fully typed from the schema
- **Status codes for bad input**: `400` the request is broken (like unreadable JSON), `415` it isn't JSON at all, `422` it's readable but the values are wrong
- **Problem Details**: `type`, `title`, `status`, `detail`, and an `errors` list a form can show next to each field
- **A form check** (`form.ts`) that reuses the server's schema, as a preview of Phase 6

## Steps

1. Read `starter/schemas.ts`. The vendor and query schemas are written. Write `VendorPatchSchema`.
2. `starter/problems.ts`: `problem`, `fieldErrors` and `handleErrors`.
3. `starter/validate.ts`: `validate(target, schema)`. Remember the gap Hono leaves: a body that isn't JSON arrives as `{}`, so check the content type yourself.
4. `starter/app.ts`: two routes are converted. Convert the other five the same way.
5. `starter/form.ts`: `checkVendorForm`, with the shared schema.
6. Run the tests:

   ```bash
   npm test -- day-058
   ```

7. Run it, and send it the worst request you can think of:

   ```bash
   node phase-5-backend/day-058-validation-and-errors/starter/main.ts
   curl -i -X POST localhost:3058/vendors -H 'Content-Type: application/json' -d '{"name":"","priceKes":-5}'
   ```

## When you're stuck

- **`c.req.valid("json")` is `never` or `any`** — the `validate(...)` middleware must be in the same `.post(...)` call as the handler, before it.
- **A form-encoded body sails through as `{}`** — check `Content-Type` in `validate` before parsing.
- **The query `limit=5` fails with "expected number"** — query values are strings. Use `z.coerce.number()`.
- **Only the first problem comes back** — you're using `parse` in a `try`, or stopping early. `safeParse` gives you every issue.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
