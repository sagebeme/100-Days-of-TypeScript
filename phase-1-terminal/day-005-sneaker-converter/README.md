# Day 5: Thrift Sneaker Size and Price Converter

Watch the video: *(not recorded yet)*

## The brief

You're scrolling a mitumba (thrift) sneaker listing priced in US dollars, sized in US shoe sizes. Write two small functions: one converts a US size to EU, the other converts a USD price to Kenyan shillings.

```
usToEuSize(8)                →  41
convertPriceToKes(20, 129)   →  2580
```

*For this exercise we're using a simplified conversion, EU size = US size + 33 — real conversion charts aren't perfectly linear across the whole size range, but this is close enough to practice functions with.*

## What you'll use

- Functions with an explicit **return type** (`: number`), so the compiler checks that every path through your function actually returns a number
- Two functions doing two clearly separate jobs, instead of one function trying to do everything

## Steps

1. Open `starter/sneaker-converter.ts`.
2. `usToEuSize`: return `usSize + 33`.
3. `convertPriceToKes`: return `usdPrice * exchangeRate`, rounded to a whole number of shillings with `Math.round` (there's no such thing as half a shilling in practice).

```bash
npm test -- day-005
```

## Check yourself

1. What does writing `: number` as the return type buy you?
2. Predict the output: `convertPriceToKes(19.99, 129)`
3. Spot the bug:
   ```ts
   export function usToEuSize(usSize: number): number {
     usSize + 33;
   }
   ```
4. Why two functions instead of one `convert(size, price, rate)`?

<details><summary>Answers</summary>

1. The compiler checks that every path through the function returns a number, and anyone calling it can see what comes back without reading the body.
2. `2579`. 19.99 × 129 is 2578.7099999999996 (floating point), and `Math.round` takes it to 2579.
3. It works out the sum and throws it away: there's no `return`. Because the return type says `number`, `tsc` catches it: "A function whose declared type is neither 'undefined', 'void', nor 'any' must return a value."
4. They do unrelated jobs. Each one is easier to name, test and reuse on its own, and a size has nothing to do with an exchange rate.

</details>

## When you're stuck

- **"A function whose declared type is neither 'void' nor 'any' must return a value"** — you have a code path (often an early `return` you forgot, or just a missing `return` keyword) that doesn't return a `number`. Check every line ends the function with `return`.
- **`convertPriceToKes` result has decimals** — you forgot `Math.round`. Prices in shillings don't have fractional units in normal use.
- **Still stuck?** Read `solution/sneaker-converter.ts`, then close it and write your own from memory.
