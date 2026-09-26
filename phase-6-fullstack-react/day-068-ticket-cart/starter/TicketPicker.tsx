import { useMemo, useReducer } from "react";
import { makeCartReducer, emptyCart, summarise, type CartSummary as Summary } from "./cart.ts";
import { QuantityStepper } from "./QuantityStepper.tsx";
import { CartSummary } from "./CartSummary.tsx";
import { formatKes } from "./format.ts";
import type { Tier } from "./types.ts";

// TODO: the tiers on the left, the order on the right (below it, on a phone).
// - The cart: useReducer, with the reducer from makeCartReducer(tiers) (useMemo, so it's made once).
// - The summary: summarise(cart, tiers), worked out on every render. Don't keep it in state.
// <div className="picker">
//   <section className="tiers" aria-labelledby="tiers-heading"><h2 id="tiers-heading">Tickets</h2>
//     <ul> per tier: <li className="tier" data-sold-out={sold out || undefined}>
//       <div className="tier-info"><h3>name</h3><p>description</p><p className="tier-price">KES 2,500</p></div>
//       sold out: <span className="badge" data-tone="sold-out">Sold out</span>, otherwise a QuantityStepper
//       whose callbacks dispatch increment, decrement and set.
//   </section>
//   when there's something in the cart, a bar that keeps the total in sight on a phone (CSS hides it on wide screens):
//     <div className="order-bar" aria-hidden="true"><span>2 people · <strong>KES 8,500</strong></span>
//       <a href="#order-heading" tabIndex={-1} className="button button-primary">Review order</a></div>
//     It's aria-hidden because the order right below says the same thing to screen readers.
//   then <CartSummary ... onCheckout={() => onCheckout(summary)} />
// </div>
export function TicketPicker({ tiers, onCheckout }: { tiers: Tier[]; onCheckout: (summary: Summary) => void }) {
  void [useMemo, useReducer, makeCartReducer, emptyCart, summarise, QuantityStepper, CartSummary, formatKes, onCheckout];
  return (
    <ul>
      {tiers.map((tier) => (
        <li key={tier.id}>TODO: {tier.name}</li>
      ))}
    </ul>
  );
}
