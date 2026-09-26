import { useId } from "react";
import { EventCard } from "./EventCard.tsx";
import type { TikitiEvent } from "./types.ts";

interface EventGridProps {
  heading: string;
  events: TikitiEvent[];
  emptyMessage: string;
}

// A titled section of cards. Each card is in a list item with a key: its id, which never changes,
// so React keeps the right card with the right event when the list is sorted or filtered.
export function EventGrid({ heading, events, emptyMessage }: EventGridProps) {
  const headingId = useId();
  return (
    <section className="section" aria-labelledby={headingId}>
      <div className="section-head">
        <h2 id={headingId}>{heading}</h2>
        {events.length > 0 && <span className="count">{events.length === 1 ? "1 event" : `${events.length} events`}</span>}
      </div>
      {events.length === 0 ? (
        <p className="empty">{emptyMessage}</p>
      ) : (
        <ul className="event-grid">
          {events.map((event) => (
            <li key={event.id}>
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
