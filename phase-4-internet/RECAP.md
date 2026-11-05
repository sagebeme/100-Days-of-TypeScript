# Phase 4 Recap: Talking to the Internet

Days 43–54. Your code started talking to other people's servers: weather and price APIs, email, SMS, M-Pesa, web pages you scraped politely, and a published SDK. It ended with a bot that sends you a message every morning, even when one of its sources is down.

## What this phase taught

REST and status codes, checking data at runtime with Zod, keeping secrets out of code, scheduling, email and SMS, surviving bad networks, scraping responsibly, browser automation, M-Pesa payments with webhooks, and packaging your own library.

## Key ideas

1. **Status codes deserve different answers.** `400` is your mistake, `404` is missing, `429` means slow down, `500`+ is theirs. Build URLs with `URL` and `searchParams`, never by gluing strings (Day 43).
2. **Check at the boundary, type from the check.** A Zod schema validates real data, and `z.infer` makes the type from the schema, so the two can't disagree (Day 44).
3. **Secrets live in `.env`, not in code or URLs.** Check the config at start-up so a missing key is a clear first-line message, and send keys in headers: URLs end up in logs (Day 45).
4. **Time zones and idempotency.** Store times in UTC, think in the user's zone, and give every job an id so a restart never sends it twice (Day 46).
5. **Retry only what's temporary.** Timeouts, dropped connections, `429` and most `5xx` are worth retrying, with exponential backoff and jitter. A `POST` that pays needs an idempotency key first (Day 48).
6. **Find the API before you scrape, and be polite.** Look in the Network tab first, follow `robots.txt`, say who you are, and go slowly. When you do scrape, use a real HTML parser and keep the selectors in one place (Days 49 and 50).
7. **Webhooks aren't trusted by default.** Daraja's callbacks aren't signed, so trust comes from a secret in the callback path, matching the checkout id and the amount, and only acting on an order still waiting for payment (Day 52).
8. **Fail gracefully.** `Promise.allSettled` lets one broken source become one "unavailable" line instead of no message at all (Day 54).

## Self-test

1. `fetch` returned a `500`. Did it throw?
2. What does `.env.example` contain, and why is it committed when `.env` isn't?
3. Why add jitter to backoff?
4. Why do locators like `getByRole("button", { name: "Search" })` outlive CSS selectors, and why wait for a condition instead of sleeping?
5. In a package's `package.json`, what do `exports` and `files` do?

<details><summary>Answers</summary>

1. No. `fetch` only throws when the network fails. A `500` is a response: check `response.ok` yourself.
2. The names of the settings, with no real values. Everyone can see which settings exist without anyone's keys being shared.
3. Without it, a thousand phones that lost signal together all retry at the same moment and knock the server over again.
4. They find things the way a person does, so a redesign that keeps the page usable keeps them working. A fixed sleep is too short on a slow day and wasted time on a fast one.
5. `exports` says which entry points people may import (with `types` first). `files` says what ships: only `dist/` and the README, never your tests or secrets.

</details>

## Build it without steps

**A fuel price watcher.** Every morning at 07:00 Nairobi time, fetch the current pump prices from a source of your choice (an API if one exists, a politely scraped page if not), check them with Zod, compare them with yesterday's saved prices, and send yourself a short message (email, SMS sandbox or Telegram) only when something changed. Retry temporary failures with backoff, keep keys in `.env`, never send the same day's message twice, and if the source is down, say so in the message instead of crashing.

No steps and no starter. Write tests with a fake `fetch` and a fake clock, so nothing in them touches the internet.
