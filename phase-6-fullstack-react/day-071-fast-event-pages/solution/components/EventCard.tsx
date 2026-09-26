import Link from "next/link";
import { Poster } from "./Poster.tsx";
import { availability, formatKes, formatWhen } from "../lib/format.ts";
import type { TikitiEvent } from "../lib/events.ts";

// Already written: Day 67's card, as a server component. It uses Next's <Link>, which fetches the
// event page in the background as the card scrolls into view, so the tap feels instant.
export function EventCard({ event }: { event: TikitiEvent }) {
  const { tone, label } = availability(event);
  return (
    <article className="event-card" aria-labelledby={`event-${event.id}`} data-status={event.status} data-tone={tone}>
      <Poster event={event} />
      <div className="event-body">
        <h3 className="event-title" id={`event-${event.id}`}>
          <Link href={`/events/${event.id}`}>{event.title}</Link>
        </h3>
        <p className="event-meta">
          <time dateTime={event.startsAt}>{formatWhen(event.startsAt)}</time>
          <span>{event.venue}</span>
        </p>
        <div className="event-foot">
          {event.status === "cancelled" ? <p className="price note">Refunds on the way</p> : <p className="price">{formatKes(event.priceKes)}</p>}
          <span className="badge" data-tone={tone}>
            {label}
          </span>
        </div>
      </div>
    </article>
  );
}
