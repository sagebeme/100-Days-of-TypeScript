# Day 86: Trip Splitter

*A brief and a test suite. No walkthrough.*

## The brief

Four friends go to Diani for the weekend. Amina pays for the Airbnb, Baraka for fuel, Chege for the seafood dinner (and he ate twice as much), Wanjiru for the boat trip (which she didn't go on). On Sunday night, who sends whom how much on M-Pesa?

Build the app that answers that, and posts the answer to the group chat.

## The money rules (tested)

- **Whole shillings, always.** Never floats: KES 1,000 ÷ 3 is 334 + 333 + 333, and every split adds back up to exactly what was paid. The leftover shillings from rounding go one each to the biggest fractions.
- **Three ways to split**: equally between some of the group, **by shares** (Chege's 2 shares pay twice as much), or **exact amounts** (which must add up to the total, or it's an error that names the expense).
- **Balances**: what each person paid minus what they owe. Positive means they're owed money. They always add up to 0. Someone who isn't on the trip is an error.
- **Settle up**: a list of M-Pesa sends that leaves everyone square, in fewer sends than there are people: the biggest debtor pays the biggest creditor, again and again.
- **A summary** for WhatsApp: the trip, the total, the average, and the sends (or "Everyone's square.").

## The page (yours to design)

Add people and expenses, pick how each is split, see balances and the settle-up list update as you type, and copy the summary with one tap. Keep the trip in `localStorage`. Show validation problems next to the form, in words.

## Steps

1. Read the tests, and the `Split` and `Expense` types in `split.ts`. `formatKes` is already written.
2. `divide`: floor every share, then hand out the leftover shillings. `npm test -- day-086 -t dividing`.
3. `owed`, for each of the three kinds of split, with its errors.
4. `balances`, then `settleUp`, then `summary`.
5. Run the tests, then build the page in `main.ts` and `index.html` (the commands under "Done when").

## Done when

```bash
npm test -- day-086
npx vite phase-8-portfolio/day-086-trip-splitter/starter
```

## Stretch

- Several trips, each with its own link.
- Currencies: a trip to Kampala in UGX, settled in KES at a fixed rate.
- Sync between phones: put Day 57's API behind it.

## Check yourself

1. Predict the output: `divide(1000, { A: 1, B: 1, C: 1 })`, `divide(10, { A: 1, B: 1, C: 1 })` and `divide(1000, { A: 1, B: 2 })`
2. Why whole shillings with `Math.floor` and a leftover, instead of `Math.round(total * weight / sum)` for each person?
3. The balances are Amina +3000, Baraka −1000, Chege −2500, Wanjiru +500. Predict `settleUp`.
4. Predict what `divide(100, { A: 0 })` does.

<details><summary>Answers</summary>

1. `{ A: 334, B: 333, C: 333 }`, `{ A: 4, B: 3, C: 3 }` (equal fractions: the leftover goes in the order given) and `{ A: 333, B: 667 }`.
2. Rounding each part on its own can make the parts add up to a shilling more or less than was paid. Rounding everyone down and handing out the leftover always adds back up exactly.
3. Chege sends Amina 2500, Baraka sends Amina 500, and Baraka sends Wanjiru 500: three sends for four people. The biggest debtor pays the biggest creditor each time.
4. It throws `Nobody to split it between`. People with weight 0 are dropped first, and then nobody's left.

</details>

## When you're stuck

- **The parts don't add up to the total** — `Math.round` on each share can give one shilling too many or too few. `Math.floor` them all, then give the shillings left over, one each, to the people with the biggest fractional parts.
- **`divide(10, …)` gives the extra shillings to the wrong people** — when the fractions are equal, keep the people in the order they came. `sort` keeps equal items in order, so sort a copy by fraction only.
- **`{ A: 0 }` doesn't throw** — drop anyone with weight 0 first, then check there's still somebody left.
- **Exact amounts that don't add up give the wrong message** — the test looks for the expense's description, the sum and the total in that order: `Boat: the parts add up to 1000, not 3000`.
- **`settleUp` loops forever or leaves someone a shilling short** — each send is the smaller of what the biggest debtor owes and what the biggest creditor is owed. Take it off both and drop anyone who reaches 0.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
