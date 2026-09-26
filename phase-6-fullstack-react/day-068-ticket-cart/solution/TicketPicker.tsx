import { useMemo, useReducer } from "react";
import { makeCartReducer, emptyCart, summarise, type CartSummary as Summary } from "./cart.ts";
import { QuantityStepper } from "./QuantityStepper.tsx";
import { CartSummary } from "./CartSummary.tsx";
import { formatKes } from "./format.ts";
import type { Tier } from "./types.ts";

// The tiers on the left, the order on the right (below, on a phone). useReducer, because the cart
// has several kinds of change with rules between them: one function holds every rule.
export function TicketPicker({ tiers, onCheckout }: { tiers: Tier[]; onCheckout: (summary: Summary) => void }) {
  const reducer = useMemo(() => makeCartReducer(tiers), [tiers]);
  const [cart, dispatch] = useReducer(reducer, emptyCart);
  const summary = summarise(cart, tiers);

  return (
    <div className="picker">
      <section className="tiers" aria-labelledby="tiers-heading">
        <h2 id="tiers-heading">Tickets</h2>
        <ul>
          {tiers.map((tier) => (
            <li key={tier.id} className="tier" data-sold-out={tier.available === 0 || undefined}>
              <div className="tier-info">
                <h3>{tier.name}</h3>
                <p>{tier.description}</p>
                <p className="tier-price">{formatKes(tier.priceKes)}</p>
              </div>
              {tier.available === 0 ? (
                <span className="badge" data-tone="sold-out">
                  Sold out
                </span>
              ) : (
                <QuantityStepper
                  label={tier.name}
                  value={cart.quantities[tier.id] ?? 0}
                  onIncrement={() => dispatch({ type: "increment", tier })}
                  onDecrement={() => dispatch({ type: "decrement", tier })}
                  onSet={(quantity) => dispatch({ type: "set", tier, quantity })}
                />
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Before the order in the page, so on a phone it rides along the bottom of the screen until
          it reaches the order, then settles just above it instead of covering it. */}
      {summary.lines.length > 0 && (
        <div className="order-bar" aria-hidden="true">
          <span>
            {summary.seats === 1 ? "1 person" : `${summary.seats} people`} · <strong>{formatKes(summary.totalKes)}</strong>
          </span>
          <a href="#order-heading" tabIndex={-1} className="button button-primary">
            Review order
          </a>
        </div>
      )}

      <CartSummary summary={summary} message={cart.message} onClear={() => dispatch({ type: "clear" })} onCheckout={() => onCheckout(summary)} />
    </div>
  );
}
