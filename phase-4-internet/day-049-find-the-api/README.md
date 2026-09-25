# Day 49: Find the API Before You Scrape — the Network Tab and robots.txt

Watch the video: *(not recorded yet)*

## The brief

You want prices from an online shop, so the obvious plan is to download its pages and pick the numbers out of the HTML. Hold on. Most modern sites don't send data inside the HTML at all: the page loads, then its JavaScript fetches the data from a JSON API. That API is right there in your browser's Network tab. Using it is faster, far more reliable, and kinder to the site than scraping HTML.

Before you write a scraper, today you build the two things a careful developer checks first:

1. **Is there an API?** Record the page in the Network tab, save it as a HAR file, and let your code list the JSON endpoints.
2. **What does the site allow?** Read its `robots.txt` properly, and build a fetcher that obeys it and never hurries the server.

```
$ node phase-4-internet/day-049-find-the-api/starter/cli.ts
The page loaded its data from 3 JSON endpoint(s):

  GET duka.example/api/products?category&page&sort  (2x, ~175 ms)
  GET duka.example/api/products/:id  (2x, ~100 ms)
  GET duka.example/api/reviews/:id?sort  (1x, ~130 ms)

What robots.txt says to FitCheckBot/1.0 (you@example.com):
  allowed      /api/products
  allowed      /api/products/:id
  DISALLOWED   /api/reviews/:id
  wait at least 2 s between requests
```

`duka.example` is a made-up shop, so the practice files are included.

## What you'll use

- **The browser's Network tab**: every request a page makes, with filters for "Fetch/XHR". Right-click and choose "Save all as HAR" to keep a recording
- **HAR files**: that recording as JSON. You check its shape with Zod and look for successful JSON responses
- **URL patterns**: `/api/products/1234` and `/api/products/5678` are one endpoint, `/api/products/:id`
- **`robots.txt`**, the standard way sites tell bots what to leave alone. You implement the real rules (RFC 9309): a bot uses the group that names it, or `*`; `*` in a pattern matches anything and `$` ends it; the **longest** matching rule wins, and `Allow` wins a tie
- **Being a good citizen**: say who you are in `User-Agent` (with a way to reach you), respect `Crawl-delay`, and go slowly even when nobody asks you to

## Steps

1. Open any shop or news site you use, open DevTools (F12), then the **Network** tab, and filter by **Fetch/XHR**. Reload the page. Click a few requests and look at the **Response** tab: that's the data the page shows.
2. `starter/robots.ts`: `parseRobots`, `matches`, `productToken`, `isAllowed` and `crawlDelay`. Read `starter/robots.txt` first and predict the answers.
3. `starter/har.ts`: `pathPattern` and `findJsonEndpoints`. `asFetchCode` is written for you.
4. `starter/polite.ts`: `politeFetcher`, a `fetch` that refuses disallowed URLs, waits between requests, and identifies itself.
5. Run the tests:

   ```bash
   npm test -- day-049
   ```

6. Run it on the practice files, then on a HAR you recorded yourself (save the site's `robots.txt` next to it):

   ```bash
   node phase-4-internet/day-049-find-the-api/starter/cli.ts
   node phase-4-internet/day-049-find-the-api/starter/cli.ts ~/Downloads/site.har ~/Downloads/robots.txt
   ```

## The rules that matter more than the code

- `robots.txt` is a request, not a lock. Respecting it is what separates a good bot from a bad one.
- Read the site's **terms of use**. Some forbid automated access entirely, even of public pages.
- Never collect personal data (names, phone numbers, profiles) just because you can see it.
- If a site offers an official API or a data export, use that. Tomorrow's scraper is for when there isn't one.

## When you're stuck

- **`/api/products?page=2` is disallowed, but there's an `Allow: /api/products`** — you took the first matching rule. The *longest* matching pattern wins, whatever order the lines are in.
- **A group is missing its second agent** — `User-agent` lines in a row share one group. Only start a new group when the previous line wasn't a `User-agent`.
- **`/*.pdf$` matches `/menu.pdf?v=2`** — `$` means the path ends there. Build your regex with `$` at the end only when the pattern ends with `$`.
- **Your HAR has no JSON** — you recorded before the page loaded. Clear the list, reload, then save.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
