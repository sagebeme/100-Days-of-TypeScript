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

## When you're stuck

- **"Argument of type 'string' is not assignable to parameter of type 'TicketType'"** — this is the union type doing its job. Pass one of the three exact strings, in quotes.
- **The VIP case doesn't need its own `if`** — by the time you reach `else`, you've already ruled out `"early-bird"` and `"student"`. Only `"vip"` is left, so a plain `else` covers it. You don't need `else if (type === "vip")`.
- **Still stuck?** Read `solution/ticket-pricer.ts`, then close it and write your own from memory.
