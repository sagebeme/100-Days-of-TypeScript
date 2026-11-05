# Day 87: Link Shortener

*A brief and a test suite. No walkthrough.*

## The brief

Build **Fupi**, a link shortener: paste `https://tikiti.example/events/2/gengetone-block-party`, get `fupi.example/gengetone`, short enough to text, print on a poster, or read out on the radio. The owner can see how many people clicked, and from which site. Nobody can see who clicked: no IP addresses are stored, ever.

`page.ts` (the home page) and `main.ts` are written. Build the backend.

## The rules (tested)

**Links**
- Only complete `http`/`https` links. A `javascript:` link would run code when clicked. Never a link to the shortener itself (a loop). At most 2,000 characters. Each problem gets its own message, in words.
- A **custom ending**: 3 to 30 lowercase letters, numbers and dashes, not starting or ending with a dash, and not a reserved word (`api`, `admin`…). It's stored in lowercase. Taken: `409`.
- A **random ending**: 6 characters from an alphabet without `l`, `1`, `o` or `0`, so it can be read out loud. On a collision, try again.

**The API**
- `POST /api/links` `{ url, slug? }` → `201 { slug, shortUrl, token, url }`. The **token** is the owner's key, shown once and stored only as a SHA-256 hash.
- At most `createPerMinute` new links per client per minute (by `X-Forwarded-For`), then `429`.
- `GET /api/links/:slug/stats` and `DELETE /api/links/:slug` need `Authorization: Bearer <token>`. A wrong key gets the same `404` as a link that doesn't exist, so keys can't be tested against links.
- Stats: total clicks, the last 7 days (days with no clicks included, oldest first), and the top 5 referring sites (`direct` when there was no referrer).

**Redirecting**
- `GET /:slug` answers `302` (not `301`: browsers cache a `301` forever, and the clicks would stop being counted), with `Cache-Control: private, max-age=0`. Endings are case-insensitive.
- Each click keeps only the time and the referring **site's name** (`whatsapp.com`), never the full address.
- An unknown ending gets a friendly `404` page.

Use Node's built-in `node:sqlite`, with parameters always bound (Day 64).

## Steps

1. Read the tests, then `links.ts` and `app.ts`. `page.ts` and `main.ts` are already written.
2. `openLinks`: create a `links` table (slug, url, token hash, created) and a `clicks` table (slug, time, referring site).
3. `urlProblem`, `slugProblem`, `randomSlug` and `referrerSite`. `npm test -- day-087 -t "checking links"`.
4. `createLink`, `findLink`, `ownsLink`, `recordClick`, `linkStats` and `deleteLink`.
5. `app.ts`: `POST /api/links` with the rate limit, then the redirect, then stats and delete.
6. Run the tests, then try it (the commands under "Done when").

## Done when

```bash
npm test -- day-087
node phase-8-portfolio/day-087-link-shortener/starter/main.ts
```

## Stretch

- A QR code for every short link.
- A stats page for owners, with a chart.
- Check new links against a list of known scam sites before shortening them.

## When you're stuck

- **`tikiti.example/events` is accepted** — `new URL()` throws on it, which is how you know it isn't a complete link. Catch that and return the "complete link" message, then check `protocol` is `http:` or `https:`, then the host.
- **The token shows up in the database** — store `createHash("sha256").update(token).digest("hex")`, and in `ownsLink` hash what you're given and compare the hashes.
- **`/GENGETONE` is a 404** — store endings in lowercase, and lowercase the ending from the address before looking it up.
- **Deleting fails, or leaves clicks behind** — the clicks point at the link. Delete them too, or declare the column `REFERENCES links(slug) ON DELETE CASCADE` (and turn on `PRAGMA foreign_keys = ON`).
- **`lastSevenDays` misses days with no clicks** — build the 7 days yourself, oldest first, and fill each from the counts, with 0 for a missing one. Store click times as ISO strings, so `substr(at, 1, 10)` is the day.
- **`direct` and `whatsapp.com` come out the other way round** — they're tied on 2. Sort by clicks, then by site name: `ORDER BY clicks DESC, site`.
- **The rate limit never resets** — keep each client's recent times and drop any older than a minute (by `now()`, not `Date.now()`, so the test's clock works).
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
