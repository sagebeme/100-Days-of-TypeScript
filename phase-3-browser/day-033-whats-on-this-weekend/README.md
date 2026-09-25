# Day 33: What's On This Weekend — fetch and Typing JSON

Watch the video: *(not recorded yet)*

## The brief

It's Thursday and the group chat wants plans. Build a page that loads a list of events, keeps only the ones on this weekend, and shows them in order with the day, time, venue and price. A "Free only" box hides the paid ones, for the end of the month. If the network fails, say so and offer a Retry button instead of showing a blank page.

```
weekendDates("2026-10-01")        →  ["2026-10-03", "2026-10-04"]    (a Thursday)
weekendEvents(events, "2026-10-01") →  the Saturday and Sunday events, earliest first
formatPrice(null)                 →  "Free"
formatPrice(1500)                 →  "KES 1,500"
formatWhen(event)                 →  "Sat 20:00"
```

## What you'll use

- `fetch(url)` and `await response.json()`
- `response.ok` and `response.status`: `fetch` only throws when the network fails. A `404` or `500` still "succeeds", so you check it yourself
- `unknown` for data you haven't checked yet, and a type guard (Day 24) that turns it into `EventItem[]`
- Passing `fetch` in as a parameter, so the tests can hand you a fake one
- `document.createElement` and `textContent` to build the list. Never put fetched text into `innerHTML`

## Steps

1. Start the dev server. Vite serves everything in `starter/public/` as it is, so the page can fetch `starter/public/events.json` like a real API:

   ```bash
   npm run dev -- phase-3-browser/day-033-whats-on-this-weekend/starter
   ```

   Open `http://localhost:5173/events.json` to see the raw data.
2. In `starter/events.ts`, write `isEventItem(value)`. An event has string `id`, `title`, `venue`, `date` and `time`, a `priceKes` that is a number **or** `null` (free), and `tags`, an array of strings.
3. `fetchEvents(url, fetchFn)`: fetch, then throw `Request failed: 404` (with the real status) if the response isn't ok. Parse the JSON as `unknown`. If it isn't an array of events, throw `Unexpected response shape`.
4. `weekendDates(today)`: the Saturday and Sunday of the coming weekend, as `YYYY-MM-DD`. On a Saturday it's today and tomorrow; on a Sunday, yesterday and today. Work in UTC so the answer doesn't depend on the computer's time zone: `new Date(`${today}T00:00:00Z`)`, `getUTCDay()`, `setUTCDate()`.
5. `weekendEvents(events, today)`: only the weekend's events, sorted by date and then time. Don't change the array you were given.
6. `formatPrice` and `formatWhen` (`"Sat 20:00"`, from the event's date and time).
7. In `starter/app.ts`, write `mountEvents(root, options)`. It returns a promise that finishes when the first load does.
   - While loading: `#status` says `Loading…` and `#retry` is hidden.
   - On success, show `3 events this weekend` (or `1 event this weekend`) and one `<li>` per event with an `<h2>` title, a `<p>` with `Sat 20:00 · Alchemist`, and a `<p class="price">`. With none, show `Nothing on this weekend. Rest up.`
   - `#free-only` re-draws the list from the events you already have. It does **not** fetch again.
   - On failure, show `Couldn't load events. Check your connection and try again.` and un-hide `#retry`. Clicking it loads again.
8. Run the tests:

   ```bash
   npm test -- day-033
   ```

## When you're stuck

- **`Property 'title' does not exist on type 'unknown'`** — good, that's TypeScript refusing to trust the network. Check with `isEventItem` first.
- **The error message never shows for a 404** — `fetch` didn't throw. Check `response.ok`.
- **The weekend is off by a day** — you mixed local time and UTC. Use the `UTC` versions of every date method.
- **A title shows up as a broken image** — you used `innerHTML`. Anyone who controls the data controls your page. Use `textContent`.
- **"Free only" makes a network request** — keep the fetched events in a variable and filter that.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
