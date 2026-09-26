# Day 85: Streak Tracker (a PWA)

*A brief and a test suite. No walkthrough.*

## The brief

Build a habit tracker people put on their home screen: one tap a day to keep a streak going ("drink 2 litres of water", "read 10 pages"). It's a **Progressive Web App**: it installs like an app, opens instantly, and works with no signal at all, because it's used in the morning, on the bus, anywhere.

## Streaks (tested)

- A day is the **calendar day where the person is**. A check-in at 00:30 in Nairobi is the next day, even though it's still the day before in UTC.
- Adding days follows the calendar, across months, years and clock changes.
- Check-ins stay sorted with no repeats; tapping again undoes; you can't check in to tomorrow.
- **The current streak** is the days in a row ending today, or ending yesterday: until today is over, not having checked in yet doesn't break it.
- Plus the longest streak ever, the share of the last 30 days done (only since the habit began), a 12-week grid (Monday to Sunday), and messages for 3, 7, 30 and 100 days.

## Offline (tested)

`offline.ts` holds the service worker's rules:

- **Pages** are network-first, so updates arrive, falling back to the cache offline.
- **Built files with a hash in their name** (and icons) are cache-first: they never change.
- **Other sites and non-GET requests** are left alone.
- **Old versions** of the app's own caches are deleted when a new one activates, and nobody else's.

Then write `sw.ts` to follow them. `vite.config.ts` builds it as `sw.js` next to `index.html`; `public/` has the manifest and icon.

## The page (yours to design)

A big, satisfying check button per habit (at least 44px), the streak, the 12-week grid, add and delete, with an undo for deleting. Keep habits in `localStorage` (wrapped in `try`/`catch`). Register the service worker only in production builds.

## Done when

```bash
npm test -- day-085
npx vite build phase-8-portfolio/day-085-streak-tracker/starter
npx vite preview --outDir phase-8-portfolio/day-085-streak-tracker/starter/dist
```

Then, in Chrome's DevTools, open Application → Service workers, tick "Offline", and reload: it should still open.

## Stretch

- A daily reminder with the Notifications API.
- Export and import habits as a file, so they survive a new phone.
- "Freeze" days: one missed day a week that doesn't break a streak.
