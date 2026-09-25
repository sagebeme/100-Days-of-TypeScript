# Day 44: Trust Nothing You Fetch — Runtime Validation with Zod

Watch the video: *(not recorded yet)*

## The brief

Yesterday's code had a quiet lie in it:

```ts
const data = (await response.json()) as OpenMeteoResponse;
```

`as` tells TypeScript "trust me". But TypeScript's checks vanish when your code runs, and the server never promised to keep its side. If Open-Meteo renames a field tomorrow, your app doesn't fail loudly: it shows `undefined°C` and carries on.

Today you check data at the border, where it enters your program. Two jobs:

1. **The weather**: a schema that checks Open-Meteo's answer *and* reshapes it into your `Today` type in one step.
2. **Matatu fares**: a list typed in by volunteers, with numbers written as text, empty names, made-up dates and one row that's just a sentence. Keep every good row, and send each bad row back with a clear reason.

```
4 fares you can trust:
  46   CBD → Kawangware     KES 80
  111  CBD → Ngong          KES 120 (peak)
  ...
5 rows sent back to the volunteers:
  row 4: fareKes: fare must be a number
  row 6: peak: peak must be true or false; updated: updated must be a date like 2026-09-01
  row 8: each fare must be an object with route, from, to, fareKes and updated
```

## What you'll use

- **[Zod](https://zod.dev)**, a library for describing the shape of data and checking real values against it
- `z.infer<typeof Schema>`: the TypeScript type comes *from* the schema, so the check and the type can never disagree
- `safeParse`, which returns `{ success, data }` or `{ success, error }` (a Result, like Day 21) instead of throwing
- `.transform()` to rename and reshape while you check
- `z.coerce.number()` to accept `"80"` as well as `80`, and `.default()` for fields people leave out
- Your own error messages, because "expected number, received NaN" means nothing to a volunteer
- A **generic** `fetchJson(url, schema, fetch)` whose return type is whatever the schema produces

## Steps

1. Read `starter/fares.json`. Before writing any code, decide which rows you'd accept.
2. `starter/schemas.ts`:
   - `ForecastSchema`: replace the placeholder with a real object schema, then `.transform()` it into the `Today` shape. Rain and wind can't be negative, the weather code is a whole number, and each daily list needs at least one entry.
   - `FareSchema`: every rule and message is listed in the TODO.
   - `describeIssues(error)`: one readable line per problem.
   - `parseFares(data)`: good rows in, bad rows explained, row numbers counted from 1.
3. `starter/fetch-json.ts`: `fetchJson`, the one function every API call in the rest of this phase goes through.
4. Run the tests:

   ```bash
   npm test -- day-044
   ```

5. Run it. It checks the fare list, then the live weather:

   ```bash
   node phase-4-internet/day-044-trust-nothing/starter/cli.ts
   ```

6. Break it on purpose: change a fare in `fares.json`, or change `temperature_2m` in the URL inside `cli.ts` to a field that doesn't exist. Read what comes back.

## When you're stuck

- **`z.infer` gives you `{}` or `unknown`** — you wrote a type by hand and a schema separately. Delete the hand-written type and use `z.infer<typeof ForecastSchema>`.
- **Your custom message never shows** — Zod picks the message from the check that failed. A missing field fails the *type* check (`z.string({ error: "…" })`), not `.min(1, "…")`.
- **`"about 70"` becomes `NaN` and slips through** — `z.coerce.number()` turns it into `NaN`, which `z.number` then rejects. That rejection is your "fare must be a number" message.
- **One bad row throws away the whole list** — `parse` on the whole array fails if any row fails. Check the rows one at a time with `safeParse`.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
