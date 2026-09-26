# Day 71: Event Pages That Load Fast — Next.js App Router

Watch the video: *(not recorded yet)*

## The brief

Most people will find a Tikiti event through a link: on WhatsApp, on X, in a Google search. They tap it on a phone, on mobile data, and decide in about three seconds whether to wait. Today the event pages move to **Next.js**, so that tap is answered with a finished page:

```
Route (app)                 Revalidate
┌ ○ /                               1m      static, rebuilt at most once a minute
├ ƒ /api/events/[id]/seats                  worked out on every request: just a number
└   /events/[id]
  ├ ● /events/1                             built ahead of time, one per event
  ├ ● /events/2
  └ …
```

## The ideas

- **Server components.** A component in `app/` runs on the server, not the phone. It can be `async` and `await` its data directly, with no `useEffect` and no loading spinner. The phone receives HTML, and none of that component's JavaScript.
- **Static generation.** `generateStaticParams` lists the events, and Next builds each page once, at build time. `revalidate = 60` rebuilds the home page in the background at most once a minute, so a new event appears without a redeploy.
- **A client island.** Only the seat count needs to change in the browser, so only `LiveSeats` has `"use client"`. It starts with the number the server put in the page, then polls a tiny route handler. It stops polling while the tab is hidden, so a phone in a pocket doesn't spend data on numbers nobody is looking at.
- **Streaming.** "More events" is slower and optional, so it's wrapped in `<Suspense>`. The event arrives first, and the extra section streams into the same response when it's ready.
- **Metadata and structured data.** `generateMetadata` gives each event its own title and link preview. A `MusicEvent` JSON-LD script tells Google it's an event, with a date, a place and a price.

## One lesson from building this: a 404 must be a 404

The first version had a `loading.tsx` for event pages, so a skeleton would show instantly. It worked, but `/events/99` answered **200 OK** with a "not found" message. A `loading.tsx` makes Next start sending the page, status line included, *before* the page has found out whether the event exists. Search engines would keep dead links, and link checkers would say they're fine.

So the page awaits the event first, and calls `notFound()` before anything is sent. Only the part that's allowed to be slow, "More events", streams afterwards.

## Steps

1. Run it: `npx next dev phase-6-fullstack-react/day-071-fast-event-pages/starter`, and open http://localhost:3000.
2. `app/page.tsx`: the home page, and `revalidate`.
3. `app/events/[id]/page.tsx`: `generateStaticParams`, `generateMetadata`, the JSON-LD, and the page.
4. `MoreEvents.tsx`, `not-found.tsx`, then `app/api/events/[id]/seats/route.ts`.
5. `LiveSeats.tsx`: the client island.
6. Test it, then build it for real and read the route table:

   ```bash
   npm test -- day-071
   npx next build phase-6-fullstack-react/day-071-fast-event-pages/starter
   npx next start phase-6-fullstack-react/day-071-fast-event-pages/starter
   curl -I localhost:3000/events/99      # HTTP/1.1 404
   ```

## When you're stuck

- **"params should be awaited"** — since Next 15, `params` is a Promise: `const { id } = await params`.
- **"You're importing a component that needs useState"** — hooks only work in client components. Put `"use client"` at the top of `LiveSeats.tsx`, and nowhere else.
- **The seat count flashes, or is empty at first** — start `useState` with `initial` from the server; don't fetch on mount.
- **Drafts show up** — `listEvents` already hides drafts; `generateStaticParams` should also leave out cancelled events.
- **`next build` fails type checking** — Next checks this folder with its own `tsconfig.json`, which uses the repo's `tsconfig.next.json`.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
