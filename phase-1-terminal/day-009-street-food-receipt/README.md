# Day 9: Street Food Order Receipt

Watch the video: *(not recorded yet)*

## The brief

A smokie pasua stand wants printed receipts that actually line up, the way a real till does — item name on the left, padded out to a fixed width, price on the right.

```
formatReceiptLine({ name: "Smokie Pasua", price: 50, quantity: 2 })
→ "Smokie Pasua        KES 100"
```

## What you'll use

- **Object types**: naming the exact shape of data you expect (`name`, `price`, `quantity`), so the compiler stops you from, say, passing a `price` as a string by mistake
- `.padEnd(width)`, a string method that adds spaces (or another character) to the *end* of a string until it reaches a target length

## Steps

1. Open `starter/receipt.ts`. The `OrderItem` type is already defined.
2. Pad `item.name` to 20 characters with `item.name.padEnd(20)`.
3. Calculate `item.price * item.quantity` for the line total.
4. Return the padded name followed by `` `KES ${lineTotal}` ``.

```bash
npm test -- day-009
```

## When you're stuck

- **Extra or missing spaces in the output** — `.padEnd(20)` pads *up to* 20 characters total, including the name itself. A 12-character name gets 8 spaces added, not 20.
- **"Argument of type 'string' is not assignable to parameter of type 'number'"** — you likely swapped `price` and `quantity`, or passed the wrong field into the multiplication. Check `OrderItem`'s field names.
- **Still stuck?** Read `solution/receipt.ts`, then close it and write your own from memory.
