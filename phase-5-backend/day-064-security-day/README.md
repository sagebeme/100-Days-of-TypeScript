# Day 64: Security Day — Injection, XSS, Secrets and Rate Limits

Watch the video: *(not recorded yet)*

## The brief

`starter/app.ts` is a small street-food reviews API. It works: you can search, post reviews, log in and change your name. It also has six holes in it, each a mistake that real apps ship every day, each marked `HOLE` in the code.

Today's tests are **attacks**. Right now, 15 of them succeed. Your job is to close the holes until every attack fails, without breaking any feature. When you're done, those tests stay in the repo as **security regression tests**: if anyone ever reopens a hole, the build goes red.

| Hole | The attack | The fix |
| --- | --- | --- |
| **1. SQL injection** | Searching for `' OR 1=1 --` returns every review; a `UNION SELECT` reads the users table | Parameters (`?`), never string gluing |
| **2. Stored XSS** | A review containing `<script>` runs in every visitor's browser | Escape all user text in HTML, and a Content Security Policy as a backstop |
| **3. Leaking secrets** | `/debug` shows the signing secret; errors show stack traces | Delete debug routes; errors say nothing; log the details privately |
| **4. Password guessing** | Unlimited login attempts | Rate limits, per account and per address |
| **5. Mass assignment** | `PATCH /me` with `{ "role": "admin" }` makes you an admin | Copy only the fields a user is allowed to change |
| **6. Missing headers** | Clickjacking, content sniffing, no HTTPS enforcement | Hono's `secureHeaders`, with a CSP |

## Why each one matters

- **Injection** turns your database into the attacker's database. The fix is always the same: the query's text is fixed, and user input only ever goes in as a parameter. In a `LIKE` search, `%` and `_` are wildcards too, so escape them to search for them literally.
- **XSS** runs the attacker's JavaScript *as your site*, with your users' cookies. Escaping stops it; a CSP that refuses inline scripts means a single missed escape isn't a disaster.
- **Secrets**: the signing secret *is* every user's login. With it, anyone can sign "I am user 2 (the admin)". Error messages and debug pages are how secrets leak most often.
- **Rate limits** turn "a million guesses a minute" into "five". Limit per *account* (to protect a user) and per *address* (to stop one attacker trying many accounts). And don't trust `X-Forwarded-For` unless your own proxy sets it: anyone can send it, with any address.
- **Mass assignment**: frameworks make "save whatever came in" easy. Always allow-list.

## Steps

1. Run the tests and read the failures: each name says what the attacker did.

   ```bash
   npm test -- day-064
   ```

2. Close the holes, in any order. For HOLE 4, write `starter/rate-limit.ts` first, then use two limiters in the login route (5 per account per 15 minutes, 20 per address per minute). Answer `429` with a `Retry-After` header. A successful login clears that account's count.
3. Run the tests again. Aim for all green, with the three feature tests still passing.
4. Attack it yourself with `curl` (the commands are in `main.ts`), before and after.

The `DROP TABLE` attack fails even in the starter, by luck: `node:sqlite` runs one statement at a time. Many database drivers happily run `x'; DROP TABLE reviews; --` as two statements. Don't rely on luck; the fix for HOLE 1 closes it properly.

## When you're stuck

- **Search stops finding anything after your fix** — the `%` wildcards belong *inside the parameter's value* (`"%" + q + "%"`), not in the SQL text around the `?`.
- **The page shows `&amp;lt;`** — you escaped twice. Escape once, at the moment text goes into HTML.
- **Every login gets 429 in the tests** — you're counting successful logins against the address too much, or never resetting. Check the limits, and reset the account's count after a success.
- **The faked `X-Forwarded-For` test fails** — the limiter key must come from `clientIp(c, options.trustProxy ?? false)`.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
