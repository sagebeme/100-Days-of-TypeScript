# Day 95: Focus Mode Browser Extension

*A brief and a test suite. No walkthrough.*

## The brief

A Chrome extension that keeps you off the sites that eat your afternoon, during the hours you choose. Click its icon to start a 25- or 50-minute session, or let a schedule switch it on ("weekdays, 09:00–12:00"). While you're focusing, opening a blocked site shows a calm page saying how long is left, not an error.

The extension is written: a background service worker, the popup, the blocked page, and a Vite build that turns them into an unpacked extension. What's missing is its brain, `rules.ts`, with no browser in sight, so all of it can be tested.

## The rules (tested)

- **Reading the list**: people paste anything: `https://www.YouTube.com/watch?v=x`, `*.reddit.com/r/kenya`, `x.com, tiktok.com`. Turn it into plain, sorted domains without repeats (`youtube.com`), and report anything that isn't a website (`"youtube" isn't a website`) instead of keeping it.
- **Matching**: blocking `youtube.com` blocks `m.youtube.com`, but never `notyoutube.com` or `youtube.com.evil.example`. Only `http` and `https` pages: never the browser's own pages.
- **The schedule** is in the person's time zone, not the computer's. A session runs from its start up to (not including) its end. An end before the start runs past midnight: a Friday 22:00–02:00 session covers the first two hours of Saturday.
- **Focusing** is a manual session that hasn't ended, or the schedule.
- **Chrome's rules**: `declarativeNetRequest` blocks pages without the extension ever seeing your browsing. Make one numbered rule per domain, redirecting whole pages (`main_frame`, not images or scripts) to `/blocked.html?site=<domain>`.
- **Time left**, rounded up: `18 min`, `1 h 05 min`.

## Why `declarativeNetRequest`

The old way was an extension that watched every request and decided on each one. That meant it read all your browsing. Manifest V3 extensions hand Chrome a list of rules instead, and Chrome applies them. Your extension asks for less, and a store reviewer (or a suspicious friend) can see exactly what it does.

## Steps

1. Read the tests, then `rules.ts`. The rest of the extension (`background.ts`, the popup, the blocked page, `chrome.ts`) is already written: skim `background.ts` to see where your functions are called.
2. `parseBlocklist`. `npm test -- day-095 -t "blocklist"`.
3. `isBlocked`. `npm test -- day-095 -t "which pages"`.
4. `inSchedule`, then `isFocusing`. `npm test -- day-095 -t "the schedule"`.
5. `toRules` and `formatLeft`.
6. Run the tests, build it, and load `starter/dist` in Chrome (see "Done when").

## Done when

```bash
npm test -- day-095
npx vite build phase-8-portfolio/day-095-focus-mode-extension/starter
```

Then in Chrome: `chrome://extensions`, turn on **Developer mode**, **Load unpacked**, and pick the `starter/dist` folder. Start a session and open one of your sites.

While designing, `npx vite phase-8-portfolio/day-095-focus-mode-extension/starter` opens `popup.html` and `blocked.html` as ordinary pages. `chrome.ts` keeps the settings in `localStorage` when it isn't running inside an extension.

## Stretch

- Let people edit the schedule in the popup, not only the list.
- A "5 more minutes" button on the blocked page that's deliberately slow: type a sentence first.
- Count how many times each site was blocked this week, and show it in the popup.

## When you're stuck

- **`notyoutube.com` gets blocked** — `host.endsWith("youtube.com")` matches it. Block when the host *is* the domain, or ends with `"." + domain`.
- **`chrome://extensions` or `not a url` throws** — `new URL()` throws on nonsense: catch it and say no. Then check the protocol is `http:` or `https:` before looking at the host.
- **`www.`, a path or a port survives in the list** — split the box on spaces, newlines and commas. For each piece: lowercase it, take the `hostname` from `new URL()` when it starts with a scheme, otherwise cut it at the first `/`, then drop a leading `*.` or `www.` and a `:port`.
- **`youtube` is accepted** — a website has at least one dot, and each part is letters, digits and dashes that don't start or end with a dash.
- **The schedule follows the computer's clock** — get the day and the time with `Intl.DateTimeFormat` in the given `timeZone` (`weekday`, `hour`, `minute`, with `hourCycle: "h23"`), never `getHours()`.
- **The Friday-night session misses Saturday's small hours** — when the end is before the start, it's on from the start to midnight on a listed day, *or* from midnight to the end on the day after a listed day.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
