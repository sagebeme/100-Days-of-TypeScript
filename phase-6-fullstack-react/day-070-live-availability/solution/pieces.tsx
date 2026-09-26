import { useEffect, useRef, useState } from "react";
import { Poster } from "./Poster.tsx";
import { availability, formatKes, formatWhen } from "./format.ts";
import type { TikitiEvent } from "./api.ts";

// Already written: the small pieces the pages are made of.

// The seats badge. When the number changes (someone else bought), it flashes, and screen readers
// hear the new number: aria-live="polite" waits until they've finished what they're reading.
export function SeatsLeft({ event }: { event: Pick<TikitiEvent, "status" | "available" | "capacity"> }) {
  const { tone, label } = availability(event);
  const previous = useRef(event.available);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (previous.current === event.available) return;
    previous.current = event.available;
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 1200);
    return () => clearTimeout(timer);
  }, [event.available]);
  return (
    <span className="badge" data-tone={tone} data-flash={flash || undefined} aria-live="polite">
      {label}
    </span>
  );
}

export function EventTile({ event }: { event: TikitiEvent }) {
  return (
    <article className="event-card" aria-labelledby={`event-${event.id}`} data-status={event.status} data-tone={availability(event).tone}>
      <Poster event={event} />
      <div className="event-body">
        <h3 className="event-title" id={`event-${event.id}`}>
          <a href={`#/events/${event.id}`}>{event.title}</a>
        </h3>
        <p className="event-meta">
          <time dateTime={event.startsAt}>{formatWhen(event.startsAt)}</time>
          <span>{event.venue}</span>
        </p>
        <div className="event-foot">
          <p className="price">{formatKes(event.priceKes)}</p>
          <SeatsLeft event={event} />
        </div>
      </div>
    </article>
  );
}

// Grey shapes where the cards will be, so the page doesn't jump when they arrive.
export function CardSkeletons({ count = 6 }: { count?: number }) {
  return (
    <ul className="event-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <div className="event-card skeleton">
            <div className="poster" />
            <div className="event-body">
              <span className="bone" style={{ width: "70%" }} />
              <span className="bone" style={{ width: "45%" }} />
              <span className="bone" style={{ width: "30%", marginTop: "1.5rem" }} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="error-panel" role="alert">
      <p>
        <strong>Couldn't load this.</strong> {message}
      </p>
      <button type="button" className="button button-primary" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

// "Updated 12s ago", ticking. Shows people the numbers are live, not a page from an hour ago.
export function UpdatedAgo({ at, fetching }: { at: number; fetching: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  return (
    <span className="live" data-fetching={fetching || undefined}>
      <span className="live-dot" aria-hidden="true" />
      {fetching ? "Updating…" : seconds < 5 ? "Live" : `Updated ${seconds}s ago`}
    </span>
  );
}
