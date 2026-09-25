# Day 45: What It Really Costs to Order Online — API Keys and .env

Watch the video: *(not recorded yet)*

## The brief

The sneakers are $120 on an American site, plus $35 shipping. In your head that's about KES 20,000. Then the bank takes its cut for paying in dollars, and the parcel lands at JKIA and meets import duty, levies and VAT. Build a tool that tells you the real price before you press Buy:

```
$ node phase-4-internet/day-045-real-cost/starter/cli.ts 120 35
Using rates from http://localhost:4545/latest with key ****tice

$1 = KES 129.35

Item                 KES 15,522
Shipping              KES 4,527
Bank's dollar fee       KES 601
Import duty           KES 5,012
IDF                     KES 501
Railway levy            KES 401
VAT                   KES 4,010
Clearing              KES 1,000
-------------------------------
Total                KES 31,574

That's 103% more than the KES 15,522 on the website.
```

The exchange rate comes from an API that needs a **key**, and that's the real lesson today: how to use a secret without ever leaking it.

The tax numbers are a **simplified example** for learning. Real duty depends on what you import, so check the Kenya Revenue Authority's current rates before relying on the total.

## What you'll use

- **API keys**: a password for your code. Anyone who has yours can use your quota or run up your bill
- **`.env` files**: keys live in a file next to your code that git ignores. `.env.example` shows everyone *which* settings exist, without the secret values
- `process.loadEnvFile()`: Node 24 reads `.env` into `process.env` itself, with no library
- **Checking config at start-up** with Zod, so a missing key is a clear message on line one, not a confusing 401 later
- **Keys in headers, not URLs**: URLs get written into logs, browser history and error messages
- `redact()`: printing `****tice` so you can tell which key is in use without showing it
- **Caching**: rates don't change every second, and free plans have small quotas

## The cost model

With `value = item + shipping` (both converted to shillings), each line is rounded to whole shillings:

| Line | Worked out as |
| --- | --- |
| Item, Shipping | dollars × the rate |
| Bank's dollar fee | value × `cardFxRate` (3%) |
| Import duty | value × `dutyRate` (25%) |
| IDF | value × `idfRate` (2.5%) |
| Railway levy | value × `rdlRate` (2%) |
| VAT | (value + duty) × `vatRate` (16%) |
| Clearing | `clearingKes`, a flat KES 1,000 |

## Steps

1. Start the practice API in its own terminal. It's a tiny local server that needs a key, like a real one:

   ```bash
   node phase-4-internet/day-045-real-cost/starter/fake-rates-server.ts
   ```

2. Copy `starter/.env.example` to `starter/.env`. Run `git status`: `.env` doesn't show up, because `.gitignore` covers it. That's what keeps your keys off GitHub.
3. `starter/config.ts`: the schema, `loadConfig(env)` and `redact(secret)`. `describe-issues.ts` is Day 44's helper.
4. `starter/rates.ts`: `createRatesClient(config, fetch)`. The key goes in the `Authorization` header. Give 401 and 429 their own messages, and keep the rate for an hour.
5. `starter/cost.ts`: `landedCost` and `formatCost`, from the table above.
6. Run the tests. Some of them start the practice server on a spare port and talk to it over real HTTP:

   ```bash
   npm test -- day-045
   ```

7. Run it with the placeholder key and read the 401. Then put the practice key (the server prints it) in `.env` and run it again.

To use a real exchange-rate service later, sign up for any rates API, put its address and your key in `.env`, and adjust `RatesSchema` to the shape it returns. Nothing else in the app changes.

## If a key ever leaks

It happens to everyone once. If a key ends up in a commit, a screenshot or a chat:

1. **Revoke it** in the provider's dashboard straight away, and make a new one. Deleting the commit isn't enough: it's already been copied.
2. Put the new key in `.env`, never in code.

## When you're stuck

- **`RATES_API_KEY is missing`** — `.env` must be in the `starter/` folder, next to `cli.ts`, and the line must be `RATES_API_KEY=your-key` with no spaces around the `=`.
- **A 401 with the right key** — the header must be exactly `Bearer <key>`, with one space and no quotes.
- **`.env` shows up in `git status`** — you named it something else, like `.env.txt`. Some editors add extensions.
- **The rate never updates** — that's the cache. Restart the program, or wait an hour.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
