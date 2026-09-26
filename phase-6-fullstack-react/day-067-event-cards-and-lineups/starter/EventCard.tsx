import { Poster } from "./Poster.tsx";
import { PriceTag } from "./PriceTag.tsx";
import { Availability } from "./Availability.tsx";
import { LineUp } from "./LineUp.tsx";
import { formatWhen } from "./format.ts";
import type { TikitiEvent } from "./types.ts";

// TODO: one event, as tikiti.css expects it:
// <article className="event-card" aria-labelledby={an id from useId()} data-status={event.status} data-tone={the availability tone}>
//   <Poster event={event} />
//   <div className="event-body">
//     <h3 className="event-title" id={the same id}><a href="#/events/1">title</a></h3>
//     <p className="event-meta"><time dateTime={event.startsAt}>formatWhen(...)</time><span>venue</span></p>
//     <LineUp acts={event.lineUp} />
//     <div className="event-foot">
//       the PriceTag, or for a cancelled event <p className="price note">Refunds on the way</p>
//       <Availability event={event} />
//     </div>
//   </div>
// </article>
export function EventCard({ event }: { event: TikitiEvent }) {
  void [Poster, PriceTag, Availability, LineUp, formatWhen];
  return <div>TODO: EventCard for {event.title}</div>;
}
