import { listEvents } from "../lib/events.ts";
import { EventCard } from "../components/EventCard.tsx";
import type { TikitiEvent } from "../lib/events.ts";

// A server component: it runs on the server (or at build time), and only its HTML reaches the
// phone. No JavaScript is sent for it at all, and the data is already in the page when it arrives.
//
// Rebuilt in the background at most once a minute (Incremental Static Regeneration). Everyone
// gets the same fast, prebuilt page; a new event shows up within a minute without a redeploy.
export const revalidate = 60;

function Section({ heading, events }: { heading: string; events: TikitiEvent[] }) {
  if (events.length === 0) return null;
  const id = heading.toLowerCase().replace(/\W+/g, "-");
  return (
    <section className="section" aria-labelledby={id}>
      <div className="section-head">
        <h2 id={id}>{heading}</h2>
        <span className="count">{events.length === 1 ? "1 event" : `${events.length} events`}</span>
      </div>
      <ul className="event-grid">
        {events.map((event) => (
          <li key={event.id}>
            <EventCard event={event} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function HomePage() {
  const events = (await listEvents()).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const onSale = events.filter((e) => e.status === "published");
  const cancelled = events.filter((e) => e.status === "cancelled");

  return (
    <>
      <section className="hero">
        <p className="eyebrow">Nairobi · December</p>
        <h1>Live music, comedy and parties near you</h1>
        <p>Pick a night out, pay with M-Pesa, and walk in with the code on your phone.</p>
      </section>
      <Section heading="On sale" events={onSale} />
      <Section heading="Cancelled" events={cancelled} />
    </>
  );
}
