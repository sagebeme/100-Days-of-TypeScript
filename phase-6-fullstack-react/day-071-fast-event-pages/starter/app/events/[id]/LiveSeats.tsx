"use client";

import { useEffect, useState } from "react";
import { availability } from "../../../lib/format.ts";

export const SEATS_POLL_MS = 15_000;

// TODO: the one part of the page that runs in the browser ("use client" above makes it so).
// - Start with `initial`, the number the server put in the page: no loading flash, and no fetch.
// - Every SEATS_POLL_MS, fetch(`/api/events/${eventId}/seats`, { cache: "no-store" }) and show the new number.
// - Don't fetch while document.visibilityState is "hidden"; on "visibilitychange", catch up at once.
// - A failed fetch keeps the number we have.
// - Clean up the timer and the listener when the component goes away.
// Show it as <p className="badge" data-tone={tone} aria-live="polite">{label}</p>, using
// availability({ status: "published", available, capacity }).
export function LiveSeats({ eventId, initial, capacity }: { eventId: number; initial: number; capacity: number }) {
  const [available] = useState(initial);
  useEffect(() => {
    void eventId;
  }, [eventId]);
  const { tone, label } = availability({ status: "published", available, capacity });
  return (
    <p className="badge" data-tone={tone}>
      TODO: {label}
    </p>
  );
}
