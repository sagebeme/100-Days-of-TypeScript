# Day 20: Food Delivery Tracker — Discriminated Unions

Watch the video: *(not recorded yet)*

## The brief

A food delivery order is always in exactly one of four states, and each state has different information attached: while it's **preparing** you know the restaurant; **on the way** you know the rider; **delivered** has a time; **cancelled** has a reason. If you model this as one object with a pile of optional fields, you'll spend your life checking which ones are filled in. Model it as a **discriminated union** and the compiler does the checking for you.

```
describeStatus({ kind: "on-the-way", rider: "Wanjiru", etaMinutes: 12 })
  →  "Wanjiru is on the way, arriving in 12 min"

describeStatus({ kind: "cancelled", reason: "Restaurant closed" })
  →  "Cancelled: Restaurant closed"
```

## What you'll use

- A **union type**: `A | B | C | D`, one of several shapes
- A shared **discriminant** field (`kind`) with a different string literal in each shape, so `switch (status.kind)` tells TypeScript which shape you're holding
- **Narrowing**: inside `case "delivered":` you can read `status.deliveredAt`, and TypeScript knows it exists. In `case "cancelled":` it doesn't
- **Exhaustiveness checking** with `never`: if someone adds a fifth status and forgets to handle it, the compiler errors

## Steps

1. Open `starter/delivery-status.ts`. The `DeliveryStatus` union is already written. Read each shape.
2. Write `describeStatus(status)` with a `switch (status.kind)`. Return these strings:
   - `preparing`: `"<restaurant> is preparing your order (about <etaMinutes> min)"`
   - `on-the-way`: `"<rider> is on the way, arriving in <etaMinutes> min"`
   - `delivered`: `"Delivered at <deliveredAt>"`
   - `cancelled`: `"Cancelled: <reason>"`
3. Write `isFinished(status)`: `true` for `delivered` and `cancelled`, `false` otherwise.
4. Write `minutesRemaining(status)`: the `etaMinutes` for `preparing` and `on-the-way`, and `0` for the finished states.
5. Add a `default:` branch to your `describeStatus` switch with the exhaustiveness check:

   ```ts
   default: {
     const unreachable: never = status;
     return unreachable;
   }
   ```

   Then add a fifth shape to the union (say `{ kind: "delayed"; reason: string }`) and watch `npm run typecheck` point at the exact switch you forgot to update. Remove it again afterwards.
6. Run the tests:

   ```bash
   npm test -- day-020
   ```

## When you're stuck

- **"Property 'rider' does not exist on type..."** — you're reading a field outside the `case` that guarantees it. Move the read inside `case "on-the-way":`.
- **The `never` line errors even though you handled everything** — check that every `kind` in the union has its own `case`, and that the spelling of each string matches exactly.
- **Why not one type with optional fields?** Try it: `{ restaurant?: string; rider?: string; ... }`. Every function would have to check which fields are there, and the compiler can't help you. The union makes illegal combinations impossible to write.
- **Still stuck?** Read `solution/delivery-status.ts`, then close it and write your own from memory.
