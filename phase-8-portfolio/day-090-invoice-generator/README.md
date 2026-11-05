# Day 90: Invoice Generator

*A brief and a test suite. No walkthrough.*

## The brief

Freelancers in Nairobi lose hours to invoices in Word: sums done by hand, VAT forgotten, the M-Pesa details copied wrong. Build an invoice generator: fill in a form, watch a proper invoice take shape beside it, and print it or save it as a PDF. No server, no account.

## The rules (tested)

- **Money is whole cents.** Never floats: in floating point 0.1 + 0.2 isn't 0.3, and an invoice a cent out makes accountants unhappy.
- **VAT is 16%**, or 0 for exempt items. Each line is rounded to the cent on its own, so the lines always add up to the totals. A discount comes off before VAT.
- **Formatting and parsing**: `KES 108,600.00`, and prices read the way people type them (`85,000`, `KES 1,234.5`). Anything else isn't a price.
- **Invoice numbers**: `INV-2026-0001`, restarting each year, never repeating.
- **Due dates** from payment terms, and whether an invoice is due, overdue or paid.
- **KRA PINs**: A or P, 9 digits, a letter.
- **Problems** before sending, in words: no client, an item with no description, a discount over 100%, a PIN in the wrong shape…
- **The printable invoice** (`renderInvoice`) shows everything, including the M-Pesa paybill instructions, and escapes every piece of typed text.

## The page (yours to design)

The form on one side, the invoice as a sheet of A4 paper on the other, updating as you type. On paper it's always black on white, even in dark mode. Add `@media print` so printing shows only the invoice, full-page. Set the page title to the invoice number: browsers use it as the PDF's file name.

## Steps

1. Read the tests, and the `Invoice` and `Totals` types in `invoice.ts`.
2. `totals`: each line's net, its discount and its VAT, then the sums. `npm test -- day-090 -t "^totals"`.
3. `formatKes` and `parseKes`, then `nextNumber`, `dueDate`, `status` and `isKraPin`, then `problems`.
4. `render.ts`: `escapeHtml`, then `renderInvoice`.
5. Run the tests, then build the page in `main.ts`, and print a test invoice to PDF (the commands under "Done when").

## Done when

```bash
npm test -- day-090
npx vite phase-8-portfolio/day-090-invoice-generator/starter
```

Print one to PDF and check it looks right on paper.

## Stretch

- Save invoices, and a list of them with paid, due and overdue.
- A QR code that opens the M-Pesa payment on a phone.
- Quotes that turn into invoices with one click.

## Check yourself

1. Predict the output: `0.1 + 0.2`. What does the invoice keep money in instead, and why?
2. Predict the output: `formatKes(10_860_000)`, `formatKes(-950_000)`, `parseKes("85,000")`, `parseKes("KES 1,234.5")` and `parseKes("1.234")`
3. Existing numbers are `INV-2025-0007`, `INV-2026-0001` and `INV-2026-0003`. Predict `nextNumber(existing, 2026)`, and why it isn't worked out from the count.
4. Predict `dueDate("2026-11-06", 30)`. On that due date itself, is the invoice due or overdue?

<details><summary>Answers</summary>

1. `0.30000000000000004`. Whole cents, as integers, so every sum is exact and an invoice is never a cent out.
2. `"KES 108,600.00"`, `"−KES 9,500.00"` (a real minus sign, in front), `8500000`, `123450` and `null`: three digits after the point isn't a price.
3. `"INV-2026-0004"`: the highest number used that year, plus 1. A count would give `0003` again here, because `0002` is missing, and a number must never repeat.
4. `"2026-12-06"`. It's still due; it's overdue only once today is *after* the due date.

</details>

## When you're stuck

- **A total is a cent out** — round each line on its own (`Math.round` of quantity × unit price), take that line's discount off and round it, then work out its VAT and round that. Add up the rounded lines; never round the sum.
- **The discounted VAT is wrong** — the discount comes off each line *before* VAT, so VAT is 16% of what's left, not of the full price.
- **`parseKes("1.234")` gives a number** — after taking out `KES`, commas and spaces, allow digits with at most two after the point (`/^\d+(\.\d{1,2})?$/`). Build the cents from the two parts as text, not with `* 100`, which brings floats back.
- **`formatKes(-950_000)` has the minus in the wrong place** — format the absolute amount, and put `−` (the minus sign, not a hyphen) in front of `KES`.
- **`nextNumber` repeats a number** — take the highest number already used *in that year* and add 1, not the count of invoices.
- **An invoice is overdue on its due date** — it's overdue only once today is *after* the due date. `YYYY-MM-DD` strings compare correctly with `>`.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
