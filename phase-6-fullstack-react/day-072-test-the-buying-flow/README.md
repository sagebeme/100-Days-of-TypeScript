# Day 72: Test the Whole Buying Flow — End-to-End with Playwright

Watch the video: *(not recorded yet)*

## The brief

Every piece of the ticketing app has unit tests. None of them proves a fan can actually buy a ticket: open the page, pick an event, choose two tickets, type a phone number, press Buy, wait for M-Pesa, and see the codes. Today's tests do exactly that, in a real Chrome, against the real app.

```
✓ lists what's on, with live seat counts
✓ buys two tickets: order, M-Pesa prompt, payment, tickets
✓ lets the fan try again after cancelling on their phone, with the seats back on sale
✓ explains when the seats sold out while the fan was deciding
✓ shows the server's reason for a phone number it won't accept
✓ gets past a server hiccup without the fan noticing
✓ doesn't sell tickets for a cancelled event
✓ can be done with the keyboard alone
✓ fits a phone screen, with nothing wider than it
```

## This found a real bug

Writing the "try again after cancelling" test turned up a bug that every unit test had missed. After a cancelled payment, the event page showed **11 seats left when the server had 14**. The page read the seat count from its cache, where it was still "fresh" from a moment before the payment was cancelled. The fix is one `invalidateQueries` in Day 70's order page, once the order settles. Each piece worked on its own; only the whole journey showed the problem. That's what end-to-end tests are for.

## What's already written

- `app/`: Day 70's app, unchanged except for that fix.
- `app/test-api.ts`: the API as a **test double**. Nothing is random: seats change only when a test says so, and a payment settles only when a test says so (`/__test/orders/1/settle`). End-to-end tests have to control the world, or they fail at random.
- `server.ts`: starts the app on a free port; `browser.ts`: finds your Chrome (Day 51).
- `buying-flow.test.ts`: the scenarios above. Read them first: they're the spec.

## What you'll build

`pages.ts`: the **page objects**. One class per page, holding how to find things, so the tests only say what happens:

```ts
const event = await whatsOn.openEvent("Gengetone Block Party");
await event.buy({ quantity: 2, phone: "0712 345 678" });
await new OrderPage(page).waitForHeading("Enter your M-Pesa PIN");
```

Find everything by **role and accessible name**, the way a person (or a screen reader) does: `getByRole("button", { name: "Buy with M-Pesa" })`, never `.button-primary`. A redesign that keeps the page usable keeps the tests passing, and a change that makes the page unusable with a screen reader fails them.

## Rules for tests that don't flake

- **Wait for things, never for time.** `waitFor()` a heading, not `setTimeout(3000)`. The order page polls every 2 seconds, so the test waits for "You're in!", however long it takes (up to a limit).
- **Reset between tests.** `beforeEach` resets the API and opens a fresh browser context: no cookies, cache or orders left over.
- **Keep the evidence.** When a test fails, a full-page screenshot lands in `test-results/`.
- **Test what the fan sees**, not how it's built: headings, buttons, messages, seat counts.

## Steps

1. Look at the app yourself: `node phase-6-fullstack-react/day-072-test-the-buying-flow/starter/server.ts`.
2. `pages.ts`: `WhatsOnPage` first, and run `npm test -- day-072 -t "lists what's on"`.
3. `EventPage`, then `OrderPage`.
4. Run everything. It takes about 20 seconds: each test drives a real browser.

   ```bash
   npm test -- day-072
   ```

5. Write one scenario of your own. How about "two tabs buy the last seat at once"?

## When you're stuck

- **The tests are skipped** — no Chrome was found. Install Chrome or Chromium, or set `CHROME_PATH`.
- **"strict mode violation: resolved to 2 elements"** — a locator matched more than one thing. Narrow it down: find the card first, then the link inside it.
- **Timeouts on the order page** — the payment only settles when the test calls `/settle`, and the page takes up to 2 seconds to notice. Wait for the heading; don't check once.
- **Still stuck?** Read `solution/pages.ts`, then close it and write your own from memory.
