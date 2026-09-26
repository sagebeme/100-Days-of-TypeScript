"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatKes } from "../../../lib/format.ts";
import { DevPay } from "./DevPay.tsx";
import type { OrderView } from "../../../server/queries.ts";

export const ORDER_POLL_MS = 2_000;

// The order, as the server rendered it, kept fresh: while it's pending, ask the API every 2 seconds;
// once it's settled, stop. (Day 70 did this with TanStack Query; one query doesn't need a library.)
export function OrderStatus({ initial, sandbox }: { initial: OrderView; sandbox: boolean }) {
  const [order, setOrder] = useState(initial);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders/${initial.id}`, { cache: "no-store" });
      if (!response.ok) return;
      const { order: latest } = (await response.json()) as { order: Omit<OrderView, "eventTitle"> };
      setOrder((current) => ({ ...current, ...latest }));
    } catch {
      // Offline for a moment: keep what we have, and ask again next time.
    }
  }, [initial.id]);

  const pending = order.status === "pending";
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(refresh, ORDER_POLL_MS);
    return () => clearInterval(timer);
  }, [pending, refresh]);

  return (
    <section className="prompt-panel" aria-labelledby="order-status" aria-live="polite">
      {pending && (
        <>
          <div className="phone-pulse" aria-hidden="true">📱</div>
          <h1 id="order-status">Enter your M-Pesa PIN</h1>
          <p>
            We've sent a prompt for <strong>{formatKes(order.amountKes)}</strong> to your phone. This page updates by itself once you've paid.
          </p>
          {sandbox && <DevPay orderId={order.id} onDone={refresh} />}
        </>
      )}
      {order.status === "paid" && (
        <>
          <div className="done-mark" aria-hidden="true">✓</div>
          <h1 id="order-status">You're in!</h1>
          <p>
            {order.quantity === 1 ? "Your ticket" : `Your ${order.quantity} tickets`} for <strong>{order.eventTitle}</strong>. Show the code at the gate.
          </p>
          <ul className="ticket-codes">
            {order.tickets.map((ticket) => (
              <li key={ticket.id}>
                <code>{ticket.code}</code>
              </li>
            ))}
          </ul>
          <Link href="/tickets">All my tickets</Link>
        </>
      )}
      {!pending && order.status !== "paid" && (
        <>
          <div className="fail-mark" aria-hidden="true">!</div>
          <h1 id="order-status">{order.status === "expired" ? "Your seats were released" : "Payment didn't go through"}</h1>
          <p>{order.problem ?? "The ten minutes to pay ran out."} No tickets were issued.</p>
          <Link className="button button-primary" href={`/events/${order.eventId}`}>
            Try again
          </Link>
        </>
      )}
    </section>
  );
}
