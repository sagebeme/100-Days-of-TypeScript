import { useState } from "react";
import { CheckoutForm } from "./CheckoutForm.tsx";
import { createOrder, type PlacedOrder } from "./api.ts";
import { CART, PRICES, totalOf } from "./cart.ts";
import { formatKes } from "./format.ts";

// Already written: the checkout page. Your form on the left, the order on the right, and "check
// your phone" once the order is placed.
function maskPhone(phone: string): string {
  // 254712345678 -> 0712 *** 678: enough to recognise, not enough to copy
  const local = `0${phone.slice(3)}`;
  return `${local.slice(0, 4)} *** ${local.slice(7)}`;
}

export function App() {
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const total = totalOf(CART);

  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <a className="logo" href="#/">
            <span className="logo-mark" aria-hidden="true">t</span>
            tikiti
          </a>
          <ol className="steps" aria-label="Progress">
            <li data-done="">Tickets</li>
            <li aria-current={placed ? undefined : "step"} data-done={placed ? "" : undefined}>Details</li>
            <li aria-current={placed ? "step" : undefined}>Pay</li>
          </ol>
        </div>
      </header>
      <main className="wrap checkout">
        <div>
          <a className="back-link" href="#/events/1">← Change tickets</a>
          <h1 className="page-title">Checkout</h1>
          {placed ? (
            <section className="prompt-panel" aria-labelledby="prompt-heading" role="status">
              <div className="phone-pulse" aria-hidden="true">📱</div>
              <h2 id="prompt-heading">Check your phone</h2>
              <p>
                We've sent an M-Pesa prompt for <strong>{formatKes(placed.totalKes)}</strong> to <strong>{maskPhone(placed.phone)}</strong>. Enter your PIN to
                pay.
              </p>
              <p className="muted">Order #{placed.id}. Your seats are held for 10 minutes. Your tickets will appear here and in your email.</p>
            </section>
          ) : (
            <CheckoutForm lines={CART} totalLabel={formatKes(total)} submit={(request) => createOrder(request)} onPlaced={setPlaced} />
          )}
        </div>
        <aside className="order-panel" aria-labelledby="summary-heading">
          <h2 id="summary-heading">Jioni Jazz Night</h2>
          <p className="muted">Sat 12 Dec · 6:00 pm · Uhuru Gardens</p>
          <ul className="order-lines">
            {CART.map((line) => (
              <li key={line.tierId}>
                <span>
                  {line.quantity} × {PRICES[line.tierId].name}
                </span>
                <span className="amount">{formatKes(PRICES[line.tierId].priceKes * line.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="order-total">
            <span>Total</span>
            <strong className="amount">{formatKes(total)}</strong>
          </div>
        </aside>
      </main>
    </>
  );
}
