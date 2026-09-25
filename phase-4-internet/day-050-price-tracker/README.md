# Day 50: Console Price Tracker — Scraping HTML Properly

Watch the video: *(not recorded yet)*

## The brief

You've had your eye on a pair of sneakers for weeks, waiting for a sale. Yesterday you checked the site on purpose; the site you want to track has no API (you checked, Day 49), so this time you do read the HTML. Build a tracker that reads a shop's listing page, remembers every price, and shows what went down, what went up, and what just hit its lowest price ever.

```
$ node phase-4-internet/day-050-price-tracker/starter/cli.ts pages/sneakers-today.html 2026-09-26
2026-09-26: 5 products

Product                       Price  Change
Air Classic Low – White  KES 10,999  ▼ KES 1,500  (lowest ever)
Retro Runner XL, Black    KES 9,499  ▲ KES 500
Canvas High Top (Red)     KES 4,250  =
Slides & Socks Combo      KES 1,999  =
Trail Grip Mid, Olive     KES 7,800  new
```

Scrapers break. Shops redesign their pages without telling you, and a scraper that doesn't notice records rubbish prices quietly for weeks. Yours will notice and stop:

```
$ node phase-4-internet/day-050-price-tracker/starter/cli.ts pages/sneakers-redesigned.html 2026-09-27
The page has changed: nothing matches article.product-card. Update SELECTORS in scrape.ts.
```

## What you'll use

- **A real HTML parser** (happy-dom's `DOMParser`, running in Node) and `querySelector`: the same tools as in the browser in Phase 3. Never regular expressions for HTML: they break on the first unexpected attribute or line break
- **Scripts switched off**: the page's own JavaScript (and its ads) never runs
- **One `SELECTORS` object**: when the shop redesigns, you fix one place
- **A selector health check** that runs *before* anything is saved
- **Messy real-world text**: `KSh 12,499`, `KES 1,999.00`, `Ksh. 850`, `&amp;`, and names split across lines
- **Tests against saved pages** in `starter/pages/`: fast, repeatable, and they don't hit anyone's server

## Steps

1. Open `starter/pages/sneakers-today.html` in your browser, then use DevTools to inspect a product card. Find the classes that `SELECTORS` uses.
2. `starter/scrape.ts`: `parsePrice`, `parseListing` and `missingSelectors`. `parseHtml` is written for you.
3. `starter/history.ts`: `record` (store only changes), `compare` and `formatTable`.
4. Run the tests:

   ```bash
   npm test -- day-050
   ```

5. Replay three days, the last one after a redesign:

   ```bash
   node phase-4-internet/day-050-price-tracker/starter/cli.ts pages/sneakers-yesterday.html 2026-09-25
   node phase-4-internet/day-050-price-tracker/starter/cli.ts pages/sneakers-today.html 2026-09-26
   node phase-4-internet/day-050-price-tracker/starter/cli.ts pages/sneakers-redesigned.html 2026-09-27
   ```

   Then fix `SELECTORS` for the redesigned page (open it and look), and run the third day again. Delete `prices.json` to start over.

## Scraping a real site

`cli.ts` also accepts a URL. Before you point it at a real shop, go through Day 49's checklist: look for an API first, read `robots.txt`, check the terms of use, and fetch at most once a day. A price tracker needs one request a day, not one a second.

## When you're stuck

- **Every price is `null`** — print the text you're parsing. Often there's a non-breaking space between `KSh` and the number; `\s` in your regex matches it.
- **Names come out as `Tom &amp; Jerry`** — you're reading `innerHTML`. Read `textContent`, which decodes entities.
- **Links are `/products/…` and don't open** — make them absolute with `new URL(href, pageUrl)`.
- **Unchanged prices show as "new"** — the history only stores changes. Look at the date of the last point: if it isn't today, that point is the previous price.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
