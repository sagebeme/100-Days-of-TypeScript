import { formatKes } from "./format.ts";
import type { CartSummary as Summary } from "./cart.ts";

interface CartSummaryProps {
  summary: Summary;
  message: string | null;
  onClear: () => void;
  onCheckout: () => void;
}

// TODO: "Your order", as tikiti.css expects it:
// <section className="order-panel" aria-labelledby="order-heading">
//   <div className="order-head"><h2 id="order-heading">Your order</h2> and, if not empty, <button className="link-button">Clear</button></div>
//   empty: <p className="order-empty">Pick your tickets and they'll show up here.</p>
//   otherwise: <ul className="order-lines"> with <li><span>2 × VIP</span><span className="amount">KES 12,000</span></li> per line
//   <p className="order-message" role="status">{message}</p>   (always there, so screen readers announce changes)
//   <div className="order-total"><span>Total<small>6 people</small></span><strong className="amount">KES 20,000</strong></div>
//      ("1 person"; no small at all when empty; the total is "KES 0" when empty, not "Free")
//   <button type="button" className="button button-primary button-block" disabled when empty>Checkout</button>
//   <p className="order-note">Pay with M-Pesa on the next step. Seats are held for 10 minutes.</p>
// </section>
export function CartSummary({ summary, message, onClear, onCheckout }: CartSummaryProps) {
  void [formatKes, message, onClear, onCheckout];
  return <p>TODO: your order, {summary.lines.length} lines</p>;
}
