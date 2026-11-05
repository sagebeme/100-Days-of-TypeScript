# Day 3: Event Ticket Pricer

Watch the video: *(not recorded yet)*

## The brief

A weekend event has three ticket types, each a different cut of the base price: early bird, student, and VIP. Write a function that prices a ticket by type.

```
priceTicket("early-bird", 1000)  →  800
priceTicket("student", 1000)     →  500
priceTicket("vip", 1000)         →  1500
```

## What you'll use

- `if` / `else if` / `else` to branch on a condition
- A **literal union type** — `"early-bird" | "student" | "vip"` — so the compiler rejects any ticket type you didn't spell out, instead of silently accepting a typo like `"stundet"`

## Steps

1. Open `starter/ticket-pricer.ts`. The `TicketType` union is already there.
2. Inside `priceTicket`, write an `if` for `type === "early-bird"` that returns `basePrice * 0.8`.
3. Add an `else if` for `"student"` that returns `basePrice * 0.5`.
4. Add an `else` for everything left (`"vip"`) that returns `basePrice * 1.5`.

```bash
npm test -- day-003
```

## Check yourself

1. What does the compiler say about `priceTicket("stundet", 1000)`, and why is that a good thing?
2. Predict the output: `priceTicket("student", 999)`
3. You replace the final `else` with `else if (type === "vip")`. All three cases are still covered, but `tsc` now complains. What does it say?
4. Why is a plain `else` enough for VIP?

<details><summary>Answers</summary>

1. `Argument of type '"stundet"' is not assignable to parameter of type 'TicketType'`. The typo is caught before the code runs, instead of falling through to the VIP price.
2. `499.5`. Nothing rounds the result.
3. "Function lacks ending return statement and return type does not include 'undefined'." An `if`/`else if` chain with no `else` has a path where nothing is returned, as far as `tsc` is concerned.
4. By the time you reach it, `"early-bird"` and `"student"` are ruled out, and the union says only `"vip"` is left.

</details>

## When you're stuck

- **"Argument of type 'string' is not assignable to parameter of type 'TicketType'"** — this is the union type doing its job. Pass one of the three exact strings, in quotes.
- **The VIP case doesn't need its own `if`** — by the time you reach `else`, you've already ruled out `"early-bird"` and `"student"`. Only `"vip"` is left, so a plain `else` covers it. You don't need `else if (type === "vip")`.
- **Still stuck?** Read `solution/ticket-pricer.ts`, then close it and write your own from memory.
