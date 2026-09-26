"use client";

import { useEffect, useState } from "react";
import { availability } from "../../../lib/format.ts";

export const SEATS_POLL_MS = 15_000;

// The one part of the page that runs in the browser: a small "island" in a page of plain HTML.
// It starts with the number the server put in the page (no loading flash, and it works before any
// JavaScript arrives), then keeps it fresh. It doesn't poll while the tab is hidden: a phone in a
// pocket shouldn't spend data or battery on seat counts nobody is looking at.
export function LiveSeats({ eventId, initial, capacity }: { eventId: number; initial: number; capacity: number }) {
  const [available, setAvailable] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const response = await fetch(`/api/events/${eventId}/seats`, { cache: "no-store" });
        if (!response.ok) return; // keep the number we have
        const body = (await response.json()) as { available: number };
        if (!cancelled) setAvailable(body.available);
      } catch {
        // Offline for a moment: keep the number we have, and try again next time.
      }
    };
    const timer = setInterval(refresh, SEATS_POLL_MS);
    document.addEventListener("visibilitychange", refresh); // catch up as soon as they look again
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [eventId]);

  const { tone, label } = availability({ status: "published", available, capacity });
  return (
    <p className="badge" data-tone={tone} aria-live="polite">
      {label}
    </p>
  );
}
