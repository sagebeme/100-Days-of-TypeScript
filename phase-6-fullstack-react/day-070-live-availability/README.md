# Day 70: Live Ticket Availability — TanStack Query

Watch the video: *(not recorded yet)*

## The brief

Seat counts go stale the moment they're loaded: other fans are buying too. Today the app talks to a real (pretend) API that behaves like a busy one:

- other fans keep buying, so seat counts drop by themselves;
- about one request in eight fails with a 503;
- a payment takes about six seconds to confirm, the time it takes to find your phone and type your PIN.

The app has to show the truth, stay usable when requests fail, and never make the fan wait for something they don't need to wait for.

## Server state isn't like other state

Yesterday's form state belonged to the page. Server state doesn't: the server owns it, it changes behind your back, and every copy in the browser is a snapshot getting older. TanStack Query handles the parts that are easy to get wrong:

| Problem | TanStack Query |
| --- | --- |
| Two components need the same data | One cache entry per **query key**; the second one doesn't fetch again |
| The data goes stale | `staleTime` says how long it's fresh; `refetchInterval` polls |
| A request fails | It retries (three times by default), and keeps the last good data on screen |
| Waiting for a payment | `refetchInterval` as a function: poll while pending, stop when settled |
| Buying changes the seat count | A **mutation**: update the cache at once (optimistic), undo it if the order fails, then refresh |

## What you'll build

1. **`queries.ts`**: the query keys, the options for each query, when to poll, and `usePlaceOrder`, a mutation with an optimistic update.
2. **`EventsPage.tsx`**: every state on purpose. Skeletons while loading, an error with Try again, the cards, and "Live" or "Updated 12s ago" in the corner.
3. **`EventPage.tsx`**: one event and the Buy form. Press Buy and the seat count drops straight away.
4. **`OrderPage.tsx`**: "Enter your M-Pesa PIN", asking every 2 seconds, until it becomes "You're in!" with the ticket codes.

`api.ts` (the typed client, which checks every answer with Zod), `ApiContext.tsx`, `pieces.tsx` and the fake API are written.

## Steps

1. Run it: `npx vite phase-6-fullstack-react/day-070-live-availability/starter`.
2. `queries.ts`: keys and query options first. `npm test -- day-070 -t queries`.
3. `EventsPage.tsx`. Leave the page open: counts change by themselves, and now and then a refresh fails without you noticing. That's the point.
4. `EventPage.tsx`, then `usePlaceOrder` in `queries.ts`.
5. `OrderPage.tsx`. Buy something, and watch the page turn into tickets. Try `0700 000 000` for a cancelled payment.
6. Run everything:

   ```bash
   npm test -- day-070
   ```

## Two lessons from building this

**Old data beats an error page.** When a background refresh fails, TanStack Query keeps the last good data, and so should you: only show the error when there's nothing else to show. Check `error && !data`, not just `error`.

**Don't make the fan wait for your housekeeping.** After an order, the seat counts should be refreshed, so `onSettled` calls `invalidateQueries`. But if `onSettled` *returns* that promise, TanStack Query keeps the mutation pending until the refresh lands. The button says "Sending…" and an error stays hidden, just to refresh numbers the fan isn't looking at. Start the refresh and don't wait: `void queryClient.invalidateQueries(...)`.

## When you're stuck

- **Two pages show different numbers for the same event** — they're using different keys. Build keys only with the `keys` helpers.
- **The optimistic number gets overwritten by an older one** — a poll landed mid-purchase. `await queryClient.cancelQueries(...)` first in `onMutate`.
- **The order page keeps asking forever** — `refetchInterval` must return `false` once the status isn't `pending`.
- **"Rendered fewer hooks than expected"** — every hook goes before the first `return`.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
