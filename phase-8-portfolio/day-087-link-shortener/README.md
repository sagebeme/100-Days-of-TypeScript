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

## Done when

```bash
npm test -- day-087
node phase-8-portfolio/day-087-link-shortener/starter/main.ts
```

## Stretch

- A QR code for every short link.
- A stats page for owners, with a chart.
- Check new links against a list of known scam sites before shortening them.
