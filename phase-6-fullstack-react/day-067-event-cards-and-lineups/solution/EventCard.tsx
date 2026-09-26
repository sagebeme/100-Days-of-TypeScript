import { useId } from "react";
import { Poster } from "./Poster.tsx";
import { PriceTag } from "./PriceTag.tsx";
import { Availability } from "./Availability.tsx";
import { LineUp } from "./LineUp.tsx";
import { availability, formatWhen } from "./format.ts";
import type { TikitiEvent } from "./types.ts";

// One event. An <article> named by its title, so a screen reader can jump from card to card.
// The title's link stretches over the whole card (see .event-title a::after in tikiti.css).
export function EventCard({ event }: { event: TikitiEvent }) {
  const titleId = useId();
  const cancelled = event.status === "cancelled";
  return (
    <article className="event-card" aria-labelledby={titleId} data-status={event.status} data-tone={availability(event).tone}>
      <Poster event={event} />
      <div className="event-body">
        <h3 className="event-title" id={titleId}>
          <a href={`#/events/${event.id}`}>{event.title}</a>
        </h3>
        <p className="event-meta">
          <time dateTime={event.startsAt}>{formatWhen(event.startsAt)}</time>
          <span>{event.venue}</span>
        </p>
        <LineUp acts={event.lineUp} />
        <div className="event-foot">
          {cancelled ? <p className="price note">Refunds on the way</p> : <PriceTag priceKes={event.priceKes} />}
          <Availability event={event} />
        </div>
      </div>
    </article>
  );
}
