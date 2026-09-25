# Day 52: Pay for a Ticket with M-Pesa — Daraja, STK Push and Webhooks

Watch the video: *(not recorded yet)*

## The brief

Here's the moment every Kenyan app gets to: taking money. A fan picks two tickets to Gengetone Night, types their number, and a moment later their phone asks for their M-Pesa PIN. They enter it, and the ticket is theirs.

That's an **STK push**, through Safaricom's **Daraja** API. It happens in two halves, and understanding why is the whole lesson:

```
Your server ──(1) "ask 0712… for KES 2,000"──▶ Daraja ──▶ the customer's phone: "Enter M-Pesa PIN"
Your server ◀──(2) "they paid, receipt TJ3SK8QX2P"── Daraja      (seconds or minutes later)
```

Step 1 only *starts* the payment. You don't know whether they paid until Safaricom calls **your** server back at a URL you gave it: a **webhook**. So your server keeps each order as `pending`, and the callback decides what happens to it.

```
$ node phase-4-internet/day-052-mpesa-tickets/starter/app.ts
Demo mode: no Daraja settings in .env, so no real payments.
Ticket shop on http://localhost:3052
Order 1e2da5ca…: STK push sent for KES 2000
Order 1e2da5ca…: paid
Ignored a repeated callback for order 1e2da5ca…
```

## What you'll use

- **OAuth client credentials**: swap your consumer key and secret (Basic auth) for a token that lasts an hour, and reuse it
- **Daraja's formats**: timestamps as `YYYYMMDDHHmmss` in Kenyan time, a base64 password, and phone numbers as `2547…` with no `+`
- **A webhook**: an HTTP endpoint on your server that Safaricom POSTs to
- **Webhook safety**, because Daraja callbacks aren't signed and anyone could POST to your URL:
  - a secret in the callback path (`/mpesa/callback/<secret>`)
  - ignore payments you never started
  - the first callback decides, and repeats are ignored (callbacks can arrive twice)
  - check the amount paid is the amount you asked for
  - always reply "Accepted", or Safaricom keeps retrying
- **Result codes**: `0` paid, `1032` the customer pressed Cancel, anything else failed (wrong PIN, not enough money, phone off)

## Steps

1. `starter/daraja.ts`: `darajaTimestamp`, `stkPassword`, `darajaPhone`, then `createDaraja` (the token, cached, and `stkPush`). The body `stkPush` sends is:

   ```json
   {
     "BusinessShortCode": 174379, "Password": "<base64>", "Timestamp": "20261003194512",
     "TransactionType": "CustomerPayBillOnline", "Amount": 2000,
     "PartyA": 254712345678, "PartyB": 174379, "PhoneNumber": 254712345678,
     "CallBackURL": "https://…/mpesa/callback/<secret>",
     "AccountReference": "TIX1A2B3C4D", "TransactionDesc": "Event tickets"
   }
   ```

2. `starter/callback.ts`: `mpesaDateToIso` and `parseCallback`.
3. `starter/server.ts`: the ordering part is written. Write `callback()`, which applies every safety rule above.
4. Run the tests:

   ```bash
   npm test -- day-052
   ```

5. Try the whole flow in **demo mode** (no account needed). In one terminal:

   ```bash
   node phase-4-internet/day-052-mpesa-tickets/starter/app.ts
   ```

   In another, buy two tickets, then play Safaricom:

   ```bash
   curl -X POST localhost:3052/events/gengetone-night/tickets -H 'Content-Type: application/json' -d '{"phone":"0712345678","quantity":2}'
   node phase-4-internet/day-052-mpesa-tickets/starter/simulate-callback.ts ws_CO_DEMO_1 paid
   curl localhost:3052/orders/<the orderId you got back>
   ```

   Try `cancelled`, `wrong-pin`, a second callback for the same payment, and `paid 1` (the wrong amount).

## Using the real Daraja sandbox

1. Create an app at [developer.safaricom.co.ke](https://developer.safaricom.co.ke) with the M-Pesa Express (STK push) product. The sandbox gives you a consumer key and secret, test shortcode `174379`, and a test passkey.
2. Safaricom has to reach your laptop, so open a public HTTPS tunnel to port 3052 with a tool like Cloudflare Tunnel or ngrok. It prints a URL like `https://something.trycloudflare.com`.
3. In `starter/.env`:

   ```
   DARAJA_CONSUMER_KEY=…
   DARAJA_CONSUMER_SECRET=…
   DARAJA_SHORTCODE=174379
   DARAJA_PASSKEY=…
   PUBLIC_URL=https://something.trycloudflare.com
   CALLBACK_SECRET=a-long-random-string
   ```

4. Start `app.ts` and buy a ticket with your own Safaricom number. The sandbox sends a real prompt; the money isn't real.

Going live needs a real paybill or till, Safaricom's approval, and production keys. Keep the secret path, the checks, and HTTPS.

## When you're stuck

- **`400.002.02 Invalid PhoneNumber`** — Daraja wants `2547…`, as a number, with no `+` and no leading `0`.
- **`Invalid Timestamp` or a password error** — the timestamp must be Kenyan time, and the password must use the *same* timestamp you send.
- **The callback never arrives** — Safaricom can't reach `localhost`. Use a tunnel, and check the URL ends with your secret.
- **The order flips from paid to cancelled** — you're not ignoring repeated callbacks. Once an order isn't `pending`, leave it alone.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
