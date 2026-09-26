import { listEvents } from "../../../lib/events.ts";
import { EventCard } from "../../../components/EventCard.tsx";

// TODO: the three soonest OTHER published events, as <ul className="event-grid"> of EventCards
// (nothing at all if there aren't any). It's an async server component: it awaits listEvents()
// itself, and the page wraps it in <Suspense> so the rest of the page doesn't wait for it.
export async function MoreEvents({ except }: { except: number }) {
  void [listEvents, EventCard, except];
  return null;
}

// Already written: what shows until MoreEvents is ready. The same shape, so nothing jumps.
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
