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

## Done when

```bash
npm test -- day-086
npx vite phase-8-portfolio/day-086-trip-splitter/starter
```

## Stretch

- Several trips, each with its own link.
- Currencies: a trip to Kampala in UGX, settled in KES at a fixed rate.
- Sync between phones: put Day 57's API behind it.
