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

## Check yourself

1. What does the `OrderItem` type stop you doing that plain JavaScript would allow?
2. Predict the output, and its length: `formatReceiptLine({ name: "Mandazi", price: 20, quantity: 3 })`
3. Predict the output: `formatReceiptLine({ name: "Chapati Beans Special Large", price: 150, quantity: 1 })`
4. Spot the bug: someone writes `item.name.padStart(20)`. What does the receipt look like?

<details><summary>Answers</summary>

1. Passing the wrong shape: a `price` of `"50"` (a string), a missing `quantity`, or a misspelt field. The compiler rejects each one at the call.
2. `"Mandazi             KES 60"`, 26 characters: the name padded to 20, then `KES 60`.
3. `"Chapati Beans Special LargeKES 150"`. `padEnd` never cuts a string that's already longer than the width, so the columns stop lining up.
4. The spaces go before the name, so names line up on the right and stick to the price: `"             MandaziKES 60"`.

</details>

## When you're stuck

- **Extra or missing spaces in the output** — `.padEnd(20)` pads *up to* 20 characters total, including the name itself. A 12-character name gets 8 spaces added, not 20.
- **"Argument of type 'string' is not assignable to parameter of type 'number'"** — you likely swapped `price` and `quantity`, or passed the wrong field into the multiplication. Check `OrderItem`'s field names.
- **Still stuck?** Read `solution/receipt.ts`, then close it and write your own from memory.
