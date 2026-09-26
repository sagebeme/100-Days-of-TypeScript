import { EVENTS } from "./events.ts";
import { EventGrid } from "./EventGrid.tsx";

// Already written: the page. Splits the events into "this weekend" and "coming up", and hands
// each list to your EventGrid.
const WEEKEND_ENDS = "2026-12-08T00:00:00+03:00";

export function App() {
  const byDate = [...EVENTS].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const soon = byDate.filter((e) => new Date(e.startsAt) < new Date(WEEKEND_ENDS));
  const later = byDate.filter((e) => new Date(e.startsAt) >= new Date(WEEKEND_ENDS));

  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <a className="logo" href="#/">
            <span className="logo-mark" aria-hidden="true">t</span>
            tikiti
          </a>
          <nav className="site-nav" aria-label="Main">
            <a href="#/" aria-current="page">What's on</a>
            <a href="#/tickets">My tickets</a>
          </nav>
        </div>
      </header>
      <main className="wrap">
        <section className="hero">
          <p className="eyebrow">Nairobi · December</p>
          <h1>Live music, comedy and parties near you</h1>
          <p>Pick a night out, pay with M-Pesa, and walk in with the QR code on your phone.</p>
        </section>
        <EventGrid heading="This weekend" events={soon} emptyMessage="Nothing on this weekend. Check what's coming up." />
        <EventGrid heading="Coming up" events={later} emptyMessage="Nothing announced yet." />
        <EventGrid heading="Just announced" events={[]} emptyMessage="New events are announced on Mondays. Check back soon." />
      </main>
      <footer className="site-footer">
        <div className="wrap">Tikiti is a practice project from 100 Days of TypeScript. Events and acts are made up.</div>
      </footer>
    </>
  );
}
