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
