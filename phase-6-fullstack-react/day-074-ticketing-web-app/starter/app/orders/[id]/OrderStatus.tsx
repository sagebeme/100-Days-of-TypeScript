"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatKes } from "../../../lib/format.ts";
import { DevPay } from "./DevPay.tsx";
import type { OrderView } from "../../../server/queries.ts";

export const ORDER_POLL_MS = 2_000;

// TODO: the order, as the server rendered it (`initial`), kept fresh.
// - refresh(): GET /api/orders/{id} ({ cache: "no-store" }), and merge its { order } into what you have
//   (the API doesn't send eventTitle: keep it). A failed request keeps what you have.
// - While the status is "pending", call refresh every ORDER_POLL_MS (setInterval in a useEffect that
//   depends on whether it's pending). Once it's settled, stop. Don't fetch before the first interval.
// - Show it like Day 70's OrderPage, in <section className="prompt-panel" aria-labelledby="order-status" aria-live="polite">:
//     pending: "Enter your M-Pesa PIN", and when `sandbox`, <DevPay orderId onDone={refresh} />
//     paid: "You're in!", "Your 2 tickets for <strong>Gengetone Block Party</strong>. Show the code at the gate.",
//           the codes in <ul className="ticket-codes">, and <Link href="/tickets">All my tickets</Link>
//     otherwise: "Your seats were released" (expired) or "Payment didn't go through", the problem, and
//           <Link className="button button-primary" href="/events/2">Try again</Link>
export function OrderStatus({ initial, sandbox }: { initial: OrderView; sandbox: boolean }) {
  void [useCallback, useEffect, useState, Link, formatKes, DevPay, sandbox];
  return <p>TODO: order {initial.id} is {initial.status}</p>;
}
