# Day 47: Ticket Drop SMS Alerts — Sending SMS with Africa's Talking

Watch the video: *(not recorded yet)*

## The brief

The good tickets sell out in minutes. Build the alert service: when a new ticket drop appears, every subscriber gets a text straight away. SMS still beats every app for reach: every phone gets it, with or without data.

```
$ node phase-4-internet/day-047-ticket-drop-sms/starter/cli.ts
Skipping numbers that don't look Kenyan: 12345
SMS to 3 number(s): TICKETS OUT: Jioni Jazz Night Tour @ KICC, Sat 14 Nov. From KES 3,500. https://tix.example/ss26 Reply STOP to opt out
...
Announced 3 drop(s).
```

Every SMS costs money, per number and per part. Get the message one character too long, or paste in one curly quote, and your bill doubles or triples. Today you learn exactly why.

## Why one character can triple the bill

SMS has two alphabets:

| Alphabet | What it covers | One SMS | Each part after that |
| --- | --- | --- | --- |
| **GSM-7** | Plain letters, digits, common symbols, some accents | 160 characters | 153 |
| **UCS-2** | Everything else: emoji, `’` `“` `…` `–`, most accents | 70 characters | 67 |

One non-GSM character switches the **whole** message to UCS-2. A 140-character alert with a single `’` becomes 3 parts instead of 1. Phones and word processors add these characters quietly, so `toGsmFriendly` swaps them for plain ones before sending. (Day 7 counted SMS parts; now you know the whole story.)

## What you'll use

- **Africa's Talking**, the SMS gateway most Kenyan apps use, through its REST API: a form POST with your `apiKey` in a header
- **A sandbox**: a practice account where messages go to a simulator on the website, not to real phones, and cost nothing
- **Batching**: big lists are sent in requests of 100 numbers
- **Per-recipient results**: a request can succeed while some numbers fail (a wrong number, or someone who blocked you)
- **Consent**: every message says how to opt out, and anyone who replied STOP is removed from the list

## Steps

1. `starter/sms-text.ts`: `smsInfo(text)` (encoding, length and parts) and `toGsmFriendly(text)`.
2. `starter/drops.ts`: `newDrops`, and `dropMessage`, which always fits one GSM-7 SMS. Shorten the event name a whole word at a time; never cut the price, the link or the opt-out.
3. `starter/subscribers.ts`: `subscribersFrom(raw, optedOut)`. `normalizePhone` is Day 32's.
4. `starter/africas-talking.ts`: `isSuccess`, `chunk`, and `africasTalkingSender`.
5. `starter/alerts.ts`: `alertNewDrops`.
6. Run the tests:

   ```bash
   npm test -- day-047
   ```

7. Run it without an account. Messages print instead of sending. Run it twice: the second time there's nothing new.

   ```bash
   node phase-4-internet/day-047-ticket-drop-sms/starter/cli.ts
   ```

   Delete `announced.json` to announce everything again.

## Sending through the sandbox

1. Create a free account at [africastalking.com](https://africastalking.com) and open the **sandbox** app.
2. Generate an API key in the sandbox settings.
3. In `starter/`, make a `.env` file:

   ```
   AT_USERNAME=sandbox
   AT_API_KEY=your-sandbox-key
   ```

4. Open the sandbox **simulator** on the website, add a phone number to it, and put that number in `subscribers.txt`. Delete `announced.json`, then run the program: the text arrives in the simulator.

Going live means a real (non-sandbox) app and username, a sender ID, and airtime on the account. Only text people who asked for it.

## When you're stuck

- **A 401** — the username must match the key: `sandbox` for a sandbox key, your app's username for a live one.
- **`InvalidPhoneNumber` for a good number** — Africa's Talking wants `+254…`. Normalise every number first.
- **Your message counts as 2 parts, but it's under 160 characters** — something in it isn't GSM-7. Run it through `smsInfo` and check the encoding.
- **Two subscribers got the same drop twice** — de-duplicate *after* normalising: `0712…` and `+254712…` are the same person.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
