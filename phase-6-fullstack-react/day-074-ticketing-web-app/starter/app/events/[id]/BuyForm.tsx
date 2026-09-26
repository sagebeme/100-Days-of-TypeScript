"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatKes } from "../../../lib/format.ts";

interface BuyFormProps {
  eventId: number;
  priceKes: number;
  available: number;
  signedIn: boolean;
}

// TODO: buying, in the browser.
// - Not signed in: <div className="buy-form"> with a line of text and
//   <Link className="button button-primary button-block" href="/login?next=/events/2">Log in to buy</Link>
// - Otherwise a <form className="buy-form"> (see Day 70's EventPage): a "Tickets" select from 1 to
//   min(10, available), labelled "2 × KES 800 = KES 1,600"; an "M-Pesa phone number" tel input;
//   an error as <p className="form-alert" role="alert">; and a submit button:
//   "Pay KES 1,600 with M-Pesa", or "Sending the M-Pesa prompt…" (and disabled) while it's busy.
// - On submit: POST /api/events/2/orders with { quantity, phone } as JSON. The cookie goes by itself.
//     201: router.push(`/orders/${order.id}`), and stay busy while the page changes
//     401: router.push to the login link (their session ran out)
//     otherwise: show the body's error, or "Something went wrong. No money was taken."
//     fetch throws: "You seem to be offline. No money was taken. Try again."
export function BuyForm({ eventId, priceKes, available, signedIn }: BuyFormProps) {
  void [useState, useRouter, Link, formatKes, priceKes, available, signedIn];
  void (null as unknown as FormEvent);
  return <p>TODO: BuyForm for event {eventId}</p>;
}
