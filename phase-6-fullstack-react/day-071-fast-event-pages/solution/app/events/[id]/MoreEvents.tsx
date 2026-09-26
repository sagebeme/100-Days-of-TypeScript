import { listEvents } from "../../../lib/events.ts";
import { EventCard } from "../../../components/EventCard.tsx";

// The three soonest other events on sale. It's slower than the rest of the page (it reads every
// event), so the page wraps it in <Suspense>: the event itself arrives first, and this part streams
// in when it's ready, into the same response.
export async function MoreEvents({ except }: { except: number }) {
  const events = (await listEvents())
    .filter((e) => e.status === "published" && e.id !== except)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 3);
  if (events.length === 0) return null;
  return (
    <ul className="event-grid">
      {events.map((event) => (
        <li key={event.id}>
          <EventCard event={event} />
        </li>
      ))}
    </ul>
  );
}

// What shows until MoreEvents is ready: the same shape, so nothing jumps when it arrives.
export function MoreEventsSkeleton() {
  return (
    <ul className="event-grid" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i}>
          <div className="event-card skeleton">
            <div className="poster" />
            <div className="event-body">
              <span className="bone" style={{ width: "70%" }} />
              <span className="bone" style={{ width: "45%" }} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
