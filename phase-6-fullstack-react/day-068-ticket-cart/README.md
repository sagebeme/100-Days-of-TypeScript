# Day 68: The Ticket Cart — useState and useReducer

Watch the video: *(not recorded yet)*

## The brief

Yesterday's cards were read-only: props in, markup out. Today the page *remembers* things. On the event page, fans pick tickets from four tiers, and the order updates as they go:

```
Early bird    KES 1,800     ● Sold out
Regular       KES 2,500     − [ 0 ] +          Your order                Clear
VIP           KES 6,000     − [ 2 ] +          2 × VIP            KES 12,000
Group of 4    KES 8,000     − [ 2 ] +          2 × Group of 4     KES 16,000
                                               Up to 10 people per order
                                               Total  10 people   KES 28,000
                                               [        Checkout         ]
```

The rules are real ones from the ticketing API: a tier can sell out, VIP is limited to 4 per order, and an order lets in at most 10 people, where a "Group of 4" ticket counts as 4. When a click would break a rule, nothing changes and the fan is told why.

## useState or useReducer?

- **`useState`** for one value that changes in simple ways. The stepper's text box keeps what's being typed in `useState` until the fan presses Enter.
- **`useReducer`** when there are several kinds of change, with rules between them. Every rule lives in one pure function, `(state, action) => newState`, that you can test without React at all. Most of today's tests never render anything.

Two ideas matter more than any API:

1. **Never change state; replace it.** React notices a change because the object is new. `state.quantities.vip++` changes the old object, so React sees nothing. The tests freeze the state to catch this.
2. **Don't store what you can work out.** The total, the number of people and the order lines all come from the quantities, so they're calculated on every render (`summarise`). A stored total goes stale the first time someone forgets to update it.

## Steps

1. Run it: `npx vite phase-6-fullstack-react/day-068-ticket-cart/starter`.
2. `starter/cart.ts`: the limits helper, the reducer, then `summarise`. Run `npm test -- day-068 -t reducer` as you go: no browser needed.
3. `QuantityStepper.tsx`: buttons, the text box, and the draft in `useState`.
4. `CartSummary.tsx`: the order, the live message and the checkout button.
5. `TicketPicker.tsx`: `useReducer`, and wire the steppers' callbacks to `dispatch`.
6. Run everything, then try it on a narrow window: the total rides along the bottom of the screen.

   ```bash
   npm test -- day-068
   ```

## Design notes

- **Buttons with names.** A "+" means nothing to a screen reader, so each one is labelled "Add one VIP".
- **40px targets.** The stepper buttons are big enough for a thumb on a bumpy matatu.
- **Messages that don't shove.** The message line keeps its height when it's empty, so the total doesn't jump down when "Up to 4 VIP per order" appears. It's a `role="status"` live region, so screen readers announce it.
- **Disabled, not hidden.** Checkout is visible but disabled when the cart is empty: the fan can see where they're heading.

## When you're stuck

- **Clicking does nothing** — the reducer returns `state` untouched, or you changed `state.quantities` in place. Build a new object with `{ ...state.quantities }`.
- **The group limit is wrong** — count seats, not tickets: `quantity × tier.seats`. When checking one tier, count the seats of all the *other* tiers.
- **The typed number is sent on every key** — keep the draft in `useState`; call `onSet` only in `onBlur` and on Enter.
- **The total says "Free"** — `formatKes(0)` is "Free", which is right for an event and wrong for an empty cart.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
