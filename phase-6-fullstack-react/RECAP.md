# Phase 6 Recap: Full-stack React

Days 67–74. You put a web app on top of the ticketing API: event cards, a cart, a checkout that shares the API's schema, live seat counts, fast server-rendered pages, end-to-end tests, a budget for cheap phones on 3G, and finally the whole thing running as one Next.js app.

## What this phase taught

Typed React components, state with `useState` and `useReducer`, forms with shared Zod schemas, server data with TanStack Query, the Next.js App Router and server components, Playwright end-to-end tests, and accessibility and performance as things you test.

## Key ideas

1. **Props are typed contracts.** A wrong prop is a compile error, not "KES NaN" on a customer's screen. Keys come from the data (`event.id`), never the index (Day 67).
2. **State is replaced, never changed.** A reducer returns a new object, because React compares by identity. Anything you can work out from state (a total) is worked out on each render, not stored (Day 68).
3. **One schema, both sides.** The form and the API check with the same Zod schema, so they can't disagree. The browser's checks are for convenience; the server's are for safety (Day 69).
4. **Server data is a cache.** Query keys that nest, polling only while an order is pending, optimistic updates you can roll back, and the last good data shown when a refresh fails (Day 70).
5. **Server components send finished HTML.** Await the data and call `notFound()` before anything is sent, so a missing event is a real `404`. Only small client islands ship JavaScript (Day 71).
6. **End-to-end tests find what unit tests can't.** A stale cache showed 11 seats instead of 14 only across a whole journey. Find things by role and name; wait for conditions, never for time (Day 72).
7. **Cheap phones are the real test.** Contrast of at least 4.5:1, real buttons, labels, images with sizes, and a JavaScript budget kept with code splitting (Day 73).
8. **One app, one set of rules.** The API mounts inside Next.js, and pages read the database through the same policy, so a page and the API can't disagree about who may see what (Day 74).

## Self-test

1. Why does a `<div onClick>` make a worse Buy button than a `<button>`?
2. A mutation's `onSettled` returns `queryClient.invalidateQueries(...)`. What does the fan notice?
3. Why does `LiveSeats` start from the number the server rendered, instead of fetching on mount?
4. What does a `loading.tsx` change about the status code of a missing page?
5. Why does the form check on submit and then on every change, rather than when each box loses focus?

<details><summary>Answers</summary>

1. A `<div>` isn't reachable with Tab, Enter doesn't press it, and a screen reader doesn't announce it as a button. A `<button>` does all of that for free.
2. The button keeps saying "Sending…" until the refresh finishes. Start the refresh with `void` and don't wait for it.
3. The right number is already in the page, so there's no loading flash, and it works before any JavaScript arrives.
4. Next starts streaming the page, status line included, before it knows the event is missing, so it answers `200`.
5. Clicking Pay makes the box lose focus first; its error appears, the button moves, and the click misses.

</details>

## Build it without steps

**A matatu seat picker.** On top of the Phase 5 booking API (yours, or a small fake one): a trip page rendered on the server with a seat map, seats taken shown live, a booking form that shares the API's schema, and an order page that polls until the booking is confirmed. Write a Playwright test for the whole journey, including two riders trying for the same seat, and keep the first download under a budget you set yourself.

No steps and no starter. Decide what runs on the server and what needs to be a client island before you write a component.
