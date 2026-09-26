import { useState } from "react";
import { EVENT, TIERS } from "./data.ts";
import { Poster } from "./Poster.tsx";
import { TicketPicker } from "./TicketPicker.tsx";
import { formatKes, formatWhen } from "./format.ts";
import type { CartSummary } from "./cart.ts";

// Already written: the event page. Your TicketPicker does the buying part.
export function App() {
  // Checkout is Day 69. For now, show what would be sent.
  const [checkout, setCheckout] = useState<CartSummary | null>(null);
  const headliners = EVENT.lineUp.filter((a) => a.headliner).map((a) => a.name);

  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <a className="logo" href="#/">
            <span className="logo-mark" aria-hidden="true">t</span>
            tikiti
          </a>
          <nav className="site-nav" aria-label="Main">
            <a href="#/">What's on</a>
            <a href="#/tickets">My tickets</a>
          </nav>
        </div>
      </header>
      <main className="wrap">
        <a className="back-link" href="#/">← All events</a>
        <div className="event-hero">
          <Poster event={EVENT} />
          <div>
            <p className="eyebrow">{EVENT.genre}</p>
            <h1>{EVENT.title}</h1>
            <p className="event-hero-meta">
              <time dateTime={EVENT.startsAt}>{formatWhen(EVENT.startsAt)}</time>
              <span>{EVENT.venue}</span>
            </p>
            <p className="event-hero-lineup">
              With <strong>{headliners.join(" and ")}</strong>, {EVENT.lineUp.filter((a) => !a.headliner).map((a) => a.name).join(" and ")}
            </p>
          </div>
        </div>
        {checkout && (
          <div className="notice" role="status">
            <strong>Checkout is Day 69.</strong> You'd be paying {formatKes(checkout.totalKes)} for {checkout.seats} people:{" "}
            {checkout.lines.map((l) => `${l.quantity} × ${l.tier.name}`).join(", ")}.
          </div>
        )}
        <TicketPicker tiers={TIERS} onCheckout={setCheckout} />
      </main>
      <footer className="site-footer">
        <div className="wrap">Tikiti is a practice project from 100 Days of TypeScript. Events and acts are made up.</div>
      </footer>
    </>
  );
}
