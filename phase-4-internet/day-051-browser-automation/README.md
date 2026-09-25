# Day 51: Browser Automation — Playwright

Watch the video: *(not recorded yet)*

## The brief

Some sites can't be read with `fetch` at all. Download the page and you get an empty shell: the content appears only after the site's own JavaScript runs, waits for its API, and draws the results. For those, you drive a real browser from code: type into the search box, click the button, wait, read what appears.

Today's practice site is **Tukio**, a small event finder that works exactly like that. You automate it with **Playwright**: search for events, press "Load more" until everything is on the page, collect the results, and save a screenshot.

```
$ node phase-4-internet/day-051-browser-automation/starter/cli.ts music
5 events found, showing 5
  Gengetone Night            2026-10-03 · Alchemist, Nairobi              KES 1,000
  Sunday Picnic Jam          2026-10-04 · Karura Forest, Nairobi          Free
  ...
Screenshot saved to …/starter/results.png
```

The same skills test your own web apps: Phase 6 uses Playwright to test a whole ticket-buying flow.

## What you'll use

- **Playwright** (`playwright-core`) driving the Chrome, Edge or Chromium already on your computer, so there's no big browser download. `browser.ts` finds it; set `CHROME_PATH` if yours lives somewhere unusual
- **Locators that match what a person sees**: `getByLabel("Search events")`, `getByRole("button", { name: "Search" })`. They keep working when a designer renames every CSS class, and they only work if the page is accessible, which is a good thing to find out
- **Waiting for a condition, never for time**: `waitFor()` on "the status says found", or "the 6th card exists". A fixed 2-second sleep is too slow on a good day and too short on a bad one
- **The page-object pattern**: everything about *how* to use the page lives in one class, so scripts and tests only say *what* to do
- **Headless and headed**: normally the browser is invisible. Add `--show` to watch it work

## Steps

1. Look at the site yourself first:

   ```bash
   node phase-4-internet/day-051-browser-automation/starter/serve.ts
   ```

   Open http://localhost:5151, search for something, and press "Load more". Then view the page source (Ctrl+U): no events in it. They're added by `site/app.js`.
2. `starter/events-page.ts`: write the six locators in the constructor, then `searchFor`, `results` and `loadEverything`. `browser.ts` and `serve.ts` are written for you.
3. Run the tests. They start the site and a real (invisible) browser:

   ```bash
   npm test -- day-051
   ```

4. Run it, and watch it:

   ```bash
   node phase-4-internet/day-051-browser-automation/starter/cli.ts music
   node phase-4-internet/day-051-browser-automation/starter/cli.ts "" Mombasa --show
   ```

## Before you automate someone else's site

Everything from Day 49 still applies, more so: a browser loads every image, script and ad, so each visit costs the site far more than one `fetch`. Look for an API first, read `robots.txt` and the terms of use, go slowly, and never automate a login that isn't yours.

## When you're stuck

- **`No Chrome, Edge or Chromium found`** — install Chrome, or set `CHROME_PATH` to your browser's executable.
- **`Timeout 30000ms exceeded` waiting for a locator** — the locator doesn't match anything. Run with `--show`, or use the browser's DevTools to check the label or button text exactly.
- **You get 5 results when there should be 12** — you read the results before "Load more" had finished. Wait for the new card, not for time.
- **`strict mode violation: resolved to 2 elements`** — your locator matches more than one thing. Make it more specific, like the list named "Events" and then its list items.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
