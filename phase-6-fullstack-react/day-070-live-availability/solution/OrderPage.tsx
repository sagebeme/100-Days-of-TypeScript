import { useQuery } from "@tanstack/react-query";
import { useApi } from "./ApiContext.tsx";
import { orderQuery } from "./queries.ts";
import { ErrorPanel } from "./pieces.tsx";
import { formatKes } from "./format.ts";

// The order page asks about the order every 2 seconds while it's pending, and stops when it isn't.
export function OrderPage({ id }: { id: number }) {
  const api = useApi();
  const { data: order, error, isPending, refetch } = useQuery(orderQuery(api, id));

  if (isPending) return <p className="loading-line">Loading your order…</p>;
  if (error && !order) return <ErrorPanel message={error.message} onRetry={() => void refetch()} />;
  const o = order!;

  return (
    <section className="prompt-panel" aria-labelledby="order-status" aria-live="polite">
      {o.status === "pending" && (
        <>
          <div className="phone-pulse" aria-hidden="true">📱</div>
          <h1 id="order-status">Enter your M-Pesa PIN</h1>
          <p>
            We've sent a prompt for <strong>{formatKes(o.amountKes)}</strong> to your phone. This page updates by itself once you've paid.
          </p>
        </>
      )}
      {o.status === "paid" && (
        <>
          <div className="done-mark" aria-hidden="true">✓</div>
          <h1 id="order-status">You're in!</h1>
          <p>
            {o.quantity === 1 ? "Your ticket is" : `Your ${o.quantity} tickets are`} below. Show the code at the gate.
          </p>
          <ul className="ticket-codes">
            {o.tickets.map((ticket) => (
              <li key={ticket.id}>
                <code>{ticket.code}</code>
              </li>
            ))}
          </ul>
        </>
      )}
      {(o.status === "cancelled" || o.status === "failed" || o.status === "expired") && (
        <>
          <div className="fail-mark" aria-hidden="true">!</div>
          <h1 id="order-status">{o.status === "expired" ? "Your seats were released" : "Payment didn't go through"}</h1>
          <p>{o.problem ?? "The ten minutes to pay ran out."} No tickets were issued.</p>
          <a className="button button-primary" href={`#/events/${o.eventId}`}>
            Try again
          </a>
        </>
      )}
    </section>
  );
}
