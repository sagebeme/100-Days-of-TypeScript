import { listEvents } from "../lib/events.ts";
import { EventCard } from "../components/EventCard.tsx";

// A server component: it runs on the server (or at build time), and only its HTML reaches the
// phone. It can be async, and await its data directly: no useEffect, no loading state.

// TODO: rebuild this page in the background at most once a minute (Incremental Static Regeneration):
// export const revalidate = 60;
export const revalidate = false;

// TODO: the home page.
// - const events = await listEvents(), sorted by startsAt.
// - The hero, as in Day 67: <section className="hero"> with <p className="eyebrow">Nairobi · December</p>,
//   <h1>Live music, comedy and parties near you</h1> and a line of text.
// - Two sections, "On sale" (published) and "Cancelled", each only if it has events:
//   <section className="section" aria-labelledby="on-sale"><div className="section-head"><h2 id="on-sale">On sale</h2>
//   <span className="count">4 events</span></div><ul className="event-grid"> <li key><EventCard event /></li> </ul></section>
export default async function HomePage() {
  void [listEvents, EventCard];
  return <p>TODO: the home page</p>;
}
