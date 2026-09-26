import { formatKes } from "./format.ts";
import type { CartSummary as Summary } from "./cart.ts";

interface CartSummaryProps {
  summary: Summary;
  message: string | null;
  onClear: () => void;
  onCheckout: () => void;
}

// "Your order": every line, the total, and the way to checkout. The message area is a live region,
// so a screen reader announces "Up to 4 VIP per order" the moment it appears.
export function CartSummary({ summary, message, onClear, onCheckout }: CartSummaryProps) {
  const empty = summary.lines.length === 0;
  return (
    <section className="order-panel" aria-labelledby="order-heading">
      <div className="order-head">
        <h2 id="order-heading">Your order</h2>
        {!empty && (
          <button type="button" className="link-button" onClick={onClear}>
            Clear
          </button>
        )}
      </div>

      {empty ? (
        <p className="order-empty">Pick your tickets and they'll show up here.</p>
      ) : (
        <ul className="order-lines">
          {summary.lines.map((line) => (
            <li key={line.tier.id}>
              <span>
                {line.quantity} × {line.tier.name}
              </span>
              <span className="amount">{formatKes(line.totalKes)}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="order-message" role="status">
        {message}
      </p>

      <div className="order-total">
        <span>
          Total
          {!empty && <small>{summary.seats === 1 ? "1 person" : `${summary.seats} people`}</small>}
        </span>
        <strong className="amount">{empty ? "KES 0" : formatKes(summary.totalKes)}</strong>
      </div>
      <button type="button" className="button button-primary button-block" disabled={empty} onClick={onCheckout}>
        Checkout
      </button>
      <p className="order-note">Pay with M-Pesa on the next step. Seats are held for 10 minutes.</p>
    </section>
  );
}
