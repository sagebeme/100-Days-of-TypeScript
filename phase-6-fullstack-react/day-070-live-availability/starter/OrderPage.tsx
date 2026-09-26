import { useQuery } from "@tanstack/react-query";
import { useApi } from "./ApiContext.tsx";
import { keys, orderQuery } from "./queries.ts";
import { ErrorPanel } from "./pieces.tsx";
import { formatKes } from "./format.ts";

// TODO: the order, which keeps asking about itself while it's pending (orderQuery does the polling).
// Once it settles (not pending), invalidate keys.events in a useEffect: a cancelled payment gives its
// seats back, and "Try again" would otherwise show the old count, still "fresh" in the cache.
//   loading / failed: as on the other pages ("Loading your order…")
// <section className="prompt-panel" aria-labelledby="order-status" aria-live="polite">
//   pending: <div className="phone-pulse" aria-hidden="true">📱</div> <h1 id="order-status">Enter your M-Pesa PIN</h1>
//            <p>We've sent a prompt for <strong>KES 5,000</strong> to your phone. This page updates by itself once you've paid.</p>
//   paid:    <div className="done-mark" aria-hidden="true">✓</div> <h1 id="order-status">You're in!</h1>
//            <p>Your 2 tickets are below (or "Your ticket is below"). Show the code at the gate.</p>
//            <ul className="ticket-codes"> with <li><code>T1-…</code></li> per ticket
//   cancelled, failed or expired:
//            <div className="fail-mark" aria-hidden="true">!</div>
//            <h1 id="order-status">"Your seats were released" (expired) or "Payment didn't go through"</h1>
//            <p>{problem, or "The ten minutes to pay ran out."} No tickets were issued.</p>
//            <a className="button button-primary" href={`#/events/${eventId}`}>Try again</a>
// </section>
export function OrderPage({ id }: { id: number }) {
  void [useQuery, useApi, keys, orderQuery, ErrorPanel, formatKes];
  return <p>TODO: OrderPage for order {id}</p>;
}
