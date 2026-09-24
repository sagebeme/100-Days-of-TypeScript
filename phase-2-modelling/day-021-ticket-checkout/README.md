# Day 21: Ticket Checkout — Errors You Can Predict

Watch the video: *(not recorded yet)*

## The brief

Selling a ticket can go wrong in ways you can see coming: the event sold out, or the buyer typed a promo code that doesn't exist. Those aren't bugs, they're normal outcomes, and your code should handle them on purpose. Today you build the checkout for a weekend event and model failure two ways:

- **Custom error classes** (`SoldOutError`, `InvalidPromoError`) that carry useful details
- A **`Result` type** so `checkout` returns either `{ ok: true, value }` or `{ ok: false, error }` instead of throwing. The caller is forced to look at both cases.

```
const sol = { name: "Sol Fest", priceKes: 1000, remaining: 5 };

checkout(sol, 2)                 →  { ok: true, value: { eventName: "Sol Fest", quantity: 2, total: 2000 } }
checkout(sol, 2, "NAIROBI10")    →  ok, total 1800   (10% off)
checkout(sol, 2, "student20")    →  ok, total 1600   (20% off, case doesn't matter)
checkout(sol, 6)                 →  { ok: false, error: SoldOutError }
checkout(sol, 1, "BOGUS")        →  { ok: false, error: InvalidPromoError }
```

## What you'll use

- `class SoldOutError extends Error`, with your own fields (`eventName`) and a `name` you set yourself
- `unknown`: the type of anything you `catch`. You have to check what it is before you use it
- `instanceof` to tell error types apart
- A generic `Result<T, E>` union, like the discriminated unions from Day 20 (`ok` is the discriminant)
- A `Map` as a small lookup table for promo codes

## Steps

1. Open `starter/checkout.ts`. `Result`, `CheckoutError`, `TicketEvent` and `Order` are already defined. Read them.
2. Finish `SoldOutError`. Its message is `"<eventName> is sold out"`, its `name` is `"SoldOutError"`, and it stores `eventName`. (Setting `name` matters: without it every error prints as plain `Error`.)
3. Finish `InvalidPromoError` the same way: message `"Promo code <code> is not valid"`, `name` `"InvalidPromoError"`, stores `code`.
4. Write `checkout(event, quantity, promoCode?)`:
   - If `quantity` is more than `event.remaining`, return `{ ok: false, error: new SoldOutError(event.name) }`. Check stock **first**.
   - If a promo code was given, look it up (ignoring case) in a `Map`: `NAIROBI10` is `0.1`, `STUDENT20` is `0.2`. Unknown code: return an `InvalidPromoError`.
   - Otherwise return `{ ok: true, value: { eventName, quantity, total } }`, with `total` rounded to a whole shilling using `Math.round`.
5. Write `parseQuantity(input: unknown)`: accept a positive whole number, or a string that holds one (`"3"`). Anything else throws `new TypeError("Invalid quantity: <input>")`. Use `typeof` checks to narrow the `unknown` before you use it.
6. Write `describeError(error: unknown)`: a friendly message for each case:
   - `SoldOutError` → `"Sorry, <eventName> is sold out"`
   - `InvalidPromoError` → `"The code <code> is not valid"`
   - any other `Error` → its `message`
   - anything else → `"Something went wrong"`
7. Run the tests:

   ```bash
   npm test -- day-021
   ```

## When you're stuck

- **"Type 'unknown' is not assignable..."** — you can't use an `unknown` value until you've narrowed it. Check `typeof input === "number"` or `error instanceof Error` first.
- **`instanceof` fails on your custom error** — make sure the class calls `super(...)` first and extends `Error`. Then check that you're testing against the class, not a string.
- **Total is off by a fraction** — decimals like `0.9` aren't exact in floating point. Wrap the final total in `Math.round(...)`.
- **When should I throw and when should I return a `Result`?** Return a `Result` for outcomes a caller should plan for (sold out, bad code). Throw for things that shouldn't happen at all (a bug, or garbage input like `parseQuantity("banana")`).
- **Still stuck?** Read `solution/checkout.ts`, then close it and write your own from memory.
