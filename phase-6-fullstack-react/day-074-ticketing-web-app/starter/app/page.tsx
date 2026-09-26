import { listOnSale } from "../server/queries.ts";
import { EventCard } from "../components/EventCard.tsx";

// Already written: what's on. A server component: the events are read from the database on the
// server, and the page arrives with them in it.
export default async function HomePage() {
  const events = await listOnSale();
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Nairobi · December</p>
        <h1>Live music, comedy and parties near you</h1>
        <p>Pick a night out, pay with M-Pesa, and walk in with the code on your phone.</p>
      </section>
      <section className="section" aria-labelledby="on-sale">
        <div className="section-head">
          <h2 id="on-sale">On sale</h2>
          <span className="count">{events.length === 1 ? "1 event" : `${events.length} events`}</span>
        </div>
        {events.length === 0 ? (
          <p className="empty">Nothing on sale right now. New events are announced on Mondays.</p>
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
    </>
  );
}
