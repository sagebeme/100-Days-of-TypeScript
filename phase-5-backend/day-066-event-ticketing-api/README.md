# Day 66: Capstone — The Event Ticketing API

Watch the video: *(not recorded yet)*

## The brief

Everything from Phase 5 in one real backend: a ticketing platform where organisers sell seats, fans pay with M-Pesa, and staff scan QR codes at the gate.

```
Organiser creates "Jioni Jazz Night", 500 seats, KES 1,000, and publishes it
Amina orders 2 tickets          -> seats held for 10 minutes, "enter your M-Pesa PIN" on her phone
Safaricom calls back: paid      -> order paid, 2 tickets: T1-3419C1CF5A2891AA, T2-055C33999142F9B6
At the gate, scan T1-…          -> {"admitted":true,"holder":"Amina"}
Scan it again                   -> 409 "Already used: this ticket got in at 19:02."
```

The happy path is the easy part. A ticketing system is judged by what happens when things go wrong:

| What goes wrong | What should happen |
| --- | --- |
| Two fans buy the last seat at the same moment | One gets it. The other hears "Sold out" |
| A fan orders, then walks off without paying | After 10 minutes the seats come back on sale, with no clean-up job |
| They press Cancel on the M-Pesa prompt | The seats come back straight away, and the order says why |
| M-Pesa is down | No seats stay held, and the fan is told no money was taken |
| Safaricom sends the same callback three times | Tickets are issued once |
| Someone pays the wrong amount | No tickets, and the order records that a refund is needed |
| Someone pays *after* their hold ran out | Tickets if seats are still left; a recorded refund if not. Their money is never just ignored |
| A stranger posts a fake "paid" callback | 404. They don't know the secret URL |
| Someone edits a QR code to get ticket 43 | Rejected: they can't sign it without the server's secret |
| A screenshot of one ticket is shown at two gates at once | Only one of them lets it in |

Every row has a test.

## What's already written

The work from earlier days, copied in and extended:

- `auth.ts`, `sessions.ts`, `passwords.ts`, `guards.ts`: sign up, log in, cookies, `requireUser` (Days 61–62)
- `events.ts`: creating, publishing and cancelling events, now with a price and a capacity (Day 62)
- `daraja.ts`, `callback.ts`: the M-Pesa client and the callback parser (Day 52)
- `payments.ts`: the `Payments` interface, with Daraja behind it in production and a fake in tests and demos
- `db.ts`, `migrate.ts`, `migrations/`: SQLite with Drizzle, and transactions (Days 59–60). Read `0003_orders_and_tickets.sql` first
- `main.ts`, `simulate-callback.ts`: run it, and pretend to be Safaricom

## What you'll build

1. **`tickets.ts`: ticket codes you can't forge.** A code is the ticket id plus an HMAC signature: `T42-9F3AC1D277B0E4A1`. Nothing is stored. The server can always work out what ticket 42's code should be, and nobody without the secret can. This string is what goes in the QR code.
2. **`policy.ts`: four new rules.** Who can buy, see an order, check people in, and see sales.
3. **`orders.ts`: holding seats and settling payments.**
   - `seatsTaken` counts paid seats plus holds that haven't run out. That's why expired holds need no clean-up job: they stop counting.
   - `placeOrder` checks and inserts in one transaction.
   - `settlePayment` turns an M-Pesa result into tickets, a released hold, or a refund, and is safe to run twice.
4. **`app.ts`: three routes.** The M-Pesa callback, check-in, and the organiser's sales numbers. Buying and viewing orders are written; read them first, and see why the M-Pesa call happens *outside* the transaction.

## Steps

1. Read `migrations/0003_orders_and_tickets.sql` and the buying route in `app.ts`.
2. `tickets.ts`, then run `npm test -- day-066 -t "ticket codes"`.
3. `policy.ts`: `npm test -- day-066 -t "policy"`.
4. `orders.ts`: `seatsTaken` and `placeOrder` first, then `settlePayment`.
5. `app.ts`: the callback, check-in and sales routes.
6. Run the whole thing:

   ```bash
   npm test -- day-066
   ```

## Try it for real

With no Daraja keys set, `main.ts` runs in demo mode: payments get ids like `ws_CO_DEMO_1`, and you play Safaricom.

```bash
node phase-5-backend/day-066-event-ticketing-api/starter/main.ts

# In another terminal. Make an organiser (everyone signs up as a fan), and an event:
curl -c org.txt -X POST localhost:3066/signup -H 'Content-Type: application/json' \
  -d '{"email":"wanjiru@example.com","name":"Wanjiru","password":"matatu-sunset-42"}'
node -e "new (require('node:sqlite').DatabaseSync)('phase-5-backend/day-066-event-ticketing-api/starter/tickets.db').exec(\"UPDATE users SET role='organiser'\")"
curl -b org.txt -X POST localhost:3066/events -H 'Content-Type: application/json' \
  -d '{"title":"Jioni Jazz Night","venue":"Uhuru Gardens","startsAt":"2026-12-12T18:00:00+03:00","priceKes":1000,"capacity":500}'
curl -b org.txt -X POST localhost:3066/events/1/publish

# A fan buys two, and "pays":
curl -c fan.txt -X POST localhost:3066/signup -H 'Content-Type: application/json' \
  -d '{"email":"amina@example.com","name":"Amina","password":"chapati-rainbow-7"}'
curl -b fan.txt -X POST localhost:3066/events/1/orders -H 'Content-Type: application/json' -d '{"quantity":2,"phone":"0712 345 678"}'
node phase-5-backend/day-066-event-ticketing-api/starter/simulate-callback.ts ws_CO_DEMO_1 2000 paid
curl -b fan.txt localhost:3066/orders/1          # the ticket codes

# At the gate (run it twice):
curl -b org.txt -X POST localhost:3066/events/1/check-in -H 'Content-Type: application/json' -d '{"code":"<a code from above>"}'
curl -b org.txt localhost:3066/events/1/sales
```

For real payments, set `DARAJA_CONSUMER_KEY`, `DARAJA_CONSUMER_SECRET`, `DARAJA_PASSKEY` and `DARAJA_CALLBACK_URL` (`https://<your app>/payments/mpesa/<CALLBACK_TOKEN>`). Deploy it the Day 65 way, with `TICKET_SECRET` and `CALLBACK_TOKEN` set to long random values. **Anyone who gets `TICKET_SECRET` can make tickets**, so it's treated like a password: never in the code, never in logs.

## Going further

- A `GET /me/tickets` route listing every ticket a fan has, across orders.
- Turn each code into a QR image. Phase 6 shows it on the ticket page.
- Cancelling an event with paid orders: record a refund for each one.
- Daraja's *STK Query* API, to ask M-Pesa about a payment whose callback never arrived.

## When you're stuck

- **The rush test sells too many seats** — the count and the insert must be in the same `database.transaction(...)`. Otherwise another order's check can run between your check and your insert.
- **A ticket gets in at both gates** — check-in must be one `UPDATE … WHERE checked_in_at IS NULL` that returns the row, not a read, then a separate write.
- **`sum()` gives `null` or a string** — no rows gives `null`, and SQLite's sum comes back as a string. Wrap it in `Number(... ?? 0)`.
- **The late-payment test fails** — when you check for room, leave the order you're settling out of the count (the `exceptOrderId` argument), or it competes with itself.
- **The callback answers 500 on junk** — `parseCallback` throws; catch it and answer 400.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
