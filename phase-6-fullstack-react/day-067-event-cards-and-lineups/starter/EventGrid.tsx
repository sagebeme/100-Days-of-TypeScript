import { EventCard } from "./EventCard.tsx";
import type { TikitiEvent } from "./types.ts";

interface EventGridProps {
  heading: string;
  events: TikitiEvent[];
  emptyMessage: string;
}

// TODO:
// <section className="section" aria-labelledby={id}>
//   <div className="section-head"><h2 id={id}>heading</h2><span className="count">3 events</span></div>
//   <ul className="event-grid"> one <li key={event.id}><EventCard event={event} /></li> per event </ul>
// </section>
// No events: <p className="empty">{emptyMessage}</p> instead of the list, and no count.
// "1 event", but "3 events".
export function EventGrid({ heading, events, emptyMessage }: EventGridProps) {
  void [EventCard, emptyMessage];
  return (
    <section>
      <h2>{heading}</h2>
      <p>TODO: {events.length} events</p>
    </section>
  );
}
