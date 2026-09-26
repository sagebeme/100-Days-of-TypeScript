# Day 67: Event Cards and Line-ups — Typed React Components

Watch the video: *(not recorded yet)*

## The brief

Phase 5 built the ticketing API. Phase 6 puts a web app on top of it: **Tikiti**. Today is its front page, a grid of event cards that has to look good on a cheap phone and a laptop, in light mode and dark.

```
┌──────────────────────────┐
│ [poster art]   GENGETONE │
│  DEC                     │
│   5                      │
├──────────────────────────┤
│ Gengetone Block Party    │
│ Sat 5 Dec · 3:00 pm      │
│ Kasarani Annex           │
│ Mtaa Sound and Odi Rider │
│   with Kaka Bass and DJ… │
│ FROM                     │
│ KES 800   ● Only 14 left │
└──────────────────────────┘
```

A React component is a function from **props** to what's on screen. TypeScript checks every prop, so `<PriceTag price="800" />` (a string, and the wrong name) fails to compile instead of showing "KES NaN" to a customer.

## What you'll use

- **Components and typed props**: `function PriceTag({ priceKes }: { priceKes: number })`
- **Composition**: `EventCard` is built from `Poster`, `LineUp`, `PriceTag` and `Availability`
- **Lists and keys**: `events.map(...)` with `key={event.id}`, so React keeps each card with its event when the list moves
- **Conditional rendering**: `&&`, the ternary, and returning `null` for "nothing to show"
- **`useId`**: unique ids that link a heading to its section (`aria-labelledby`)
- **`Intl`**: prices, dates in Nairobi time, and "A, B and C" lists, without writing the rules yourself

## The design is part of the job

`tikiti.css` is written: a small design system with colour tokens, dark mode, focus rings and reduced motion. Your components just use its class names. Things worth noticing as you build:

- **Colour is never the only signal.** "Sold out" is red *and* says Sold out.
- **The whole card is a link**, but only the title is an `<a>`. Its `::after` stretches over the card, so screen readers hear one link, not a card full of them.
- **Decoration is hidden from screen readers.** The poster's date is also written out in the card, so the poster is `aria-hidden`.
- **Real text, real dates.** `<time dateTime="2026-12-12T18:00:00+03:00">` tells machines what "Sat 12 Dec" means.

## Steps

1. Run it: `npx vite phase-6-fullstack-react/day-067-event-cards-and-lineups/starter`, and open the address it prints. Every component says TODO.
2. `starter/format.ts`: `formatKes`, `formatWhen` and `availability`.
3. `PriceTag.tsx`, `Availability.tsx`, then `LineUp.tsx`.
4. `EventCard.tsx`: put them together. The comment shows the exact HTML the stylesheet expects.
5. `EventGrid.tsx`: the section, the list and the empty state.
6. Run the tests, and look at the page on a narrow window and in dark mode:

   ```bash
   npm test -- day-067
   ```

## When you're stuck

- **The date is an hour or three off** — pass `timeZone: "Africa/Nairobi"`. Without it you get the time zone of whoever's computer runs it.
- **"6:00 PM" instead of "6:00 pm"** — `dayPeriod` comes back in capitals in some places; lowercase it.
- **"Each child in a list should have a unique key"** — the `key` goes on the outermost element inside `map`: the `<li>`, not the card inside it.
- **The keys test fails** — use `event.id`, not the index. The index of the first card changes when the list is reversed; the id doesn't.
- **An empty `<p>` shows for events with no line-up** — return `null` from `LineUp`.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
