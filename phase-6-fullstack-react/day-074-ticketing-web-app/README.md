# Day 74: Capstone — The Ticketing Web App, Full Stack

Watch the video: *(not recorded yet)*

## The brief

Phase 5 built the ticketing API. Phase 6 built the pieces of a web app. Today they become one product: a Next.js app with the real API inside it, where a fan signs up, buys tickets with M-Pesa, and walks in; and an organiser runs the gate from their phone.

```
Fan                                             Organiser, at the gate
─────────────────────────────                   ─────────────────────────────
What's on → Gengetone Block Party               Gate check-in       1 of 2 in
Log in to buy → back to the event               [ T1-3419C1CF5A2891AA ] [Check]
2 × KES 800, 0712 345 678 → Pay                 ┌──────────────────────────────┐
"Enter your M-Pesa PIN" …                       │ ✓  Let them in: Amina Otieno │
"You're in!"  T1-3419C1CF5A2891AA               └──────────────────────────────┘
              T2-055C33999142F9B6               (scan it again: ✕ Already used)
```

## How it fits together

```
Browser ── pages (server components) ──→ server/queries.ts ──┐
   │                                                        ├─→ SQLite, through Day 66's code
   └──── client components ── fetch /api/… ──→ route.ts ──→ Day 66's Hono API
```

- **One server** (`server/context.ts`). One database connection, the API, the secrets and the payments, made once per process. Next's dev server reloads modules on every save, so the instance lives on `globalThis`, or each save would open another database connection.
- **The API inside Next** (`app/api/[[...route]]/route.ts`). A Hono app is a function from a `Request` to a `Response`, and so is a route handler: Day 66's whole API mounts in a few lines, untouched.
- **Pages read the database directly** (`server/queries.ts`). A server component doesn't need to call its own API over HTTP. It uses the same functions and the same `policy.ts` rules, so a page and the API can't disagree about who may see what.
- **Who's looking** (`server/viewer.ts`). The layout reads the session cookie on the server, so pages arrive already knowing who you are: no flash of "Log in" before your name.
- **Three client islands**: `BuyForm`, `OrderStatus` (polls until M-Pesa answers) and `CheckIn`. Everything else is plain HTML from the server.
- **A sandbox for M-Pesa.** In development, nobody's phone gets a prompt, so the order page shows "Enter PIN and pay" and "Cancel on the phone" buttons that send exactly what Safaricom would. They're never mounted in production.

## What's already written

The Day 66 API (`server/`, with its migrations as a module so Next can bundle them), the seed data, the layout, every page, `AuthForm`, `DevPay`, `Poster`, `EventCard` and the styles.

## What you'll build

1. `server/context.ts`: `getServer`, `resetServer` and `start`.
2. `app/api/[[...route]]/route.ts`: mount the API.
3. `server/viewer.ts`: `getViewer`.
4. `server/queries.ts`: `listOnSale`, `findEvent`, `findOrder`, `myTickets`.
5. `app/events/[id]/BuyForm.tsx`, `app/orders/[id]/OrderStatus.tsx` and `app/events/[id]/check-in/CheckIn.tsx`.

## Steps

1. Run it: `npx next dev phase-6-fullstack-react/day-074-ticketing-web-app/starter`. Everything says TODO, or "Nothing on sale".
2. `context.ts` and `route.ts`, then check the API answers: `curl localhost:3000/api/events`.
3. `viewer.ts` and `queries.ts`: the pages come alive. Log in with a demo account (they're listed on the login page).
4. `BuyForm`, then `OrderStatus`: buy something, and pay with the sandbox buttons.
5. `CheckIn`: log in as the organiser in another browser (or a private window) and let the fan in, twice.
6. Run the tests:

   ```bash
   npm test -- day-074
   ```

## Two lessons from building this

**Browsers hide cookies from scripts, and so do test browsers.** The first version of these tests signed in through the API and read the `Set-Cookie` header, and every one failed: happy-dom, like a real browser, won't show that header to a script, or let one send a `Cookie` header. So the server is tested in Node, where requests are real, and the components are tested in happy-dom against a small pretend API.

**Don't let the database decide what the page looks like while it's being built.** `next build` would try to prerender pages, and prerendering would need the database and the production secrets on the build machine. Pages that read the session (all of these, through the layout) are rendered per request, so the build needs neither.

## When you're stuck

- **"Cannot find module" for `node:sqlite` in the browser** — a client component imported something from `server/`. Only `import type` from there in a `"use client"` file.
- **The API answers 404 for everything** — Day 66's routes start at `/events`; the Next app sends `/api/events`. Mount it under `new Hono().basePath("/api")`.
- **Logged in, but the header still says Log in** — after logging in, `router.refresh()` re-renders the server components with the new cookie. `AuthForm` does this; check `getViewer` reads the right cookie name (`COOKIE`).
- **The order page never updates** — the interval must stop once the order isn't pending, and start again only if it is. Make the `useEffect` depend on whether it's pending.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.

## Phase 6 done

Eight days ago this was an API with no face. Now it's a fast, accessible web app: typed components, a cart with real rules, forms that share the API's schema, live data, pages that load before the spinner would have, tests that click through the whole journey, and a check that it works on a cheap phone. Phase 7 hands it to an AI.
