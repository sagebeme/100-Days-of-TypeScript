import { lazy, Suspense, useState } from "react";
import posterUrl from "./poster.svg";
import crowd1 from "./crowd-1.svg";
import crowd2 from "./crowd-2.svg";
import crowd3 from "./crowd-3.svg";

// The seat map is big and most fans never open it, so it's its own download, fetched only when
// someone asks for it. Everyone else never pays for it.
const SeatMap = lazy(() => import("./SeatMap.tsx"));

const PHOTOS = [
  { src: crowd1, alt: "The crowd at last year's party, arms up at dusk" },
  { src: crowd2, alt: "Dancers in front of the main stage" },
  { src: crowd3, alt: "Friends sharing chips by the food stalls" },
];

export function TicketPage() {
  const [saved, setSaved] = useState(false);
  const [showSeats, setShowSeats] = useState(false);
  const [message, setMessage] = useState("");

  const share = async () => {
    const data = { title: "Gengetone Block Party", url: location.href };
    if (navigator.share) await navigator.share(data).catch(() => {});
    else {
      await navigator.clipboard?.writeText(data.url);
      setMessage("Link copied");
    }
  };

  return (
    <>
      <header className="top">
        <a className="logo" href="/">
          tikiti
        </a>
      </header>
      <main>
        {/* The biggest thing on screen, so it loads first: fetchpriority="high", and never lazy. */}
        <img className="poster" src={posterUrl} width={1200} height={675} alt="Gengetone Block Party, 5 December, Kasarani Annex" fetchPriority="high" />
        <div className="content">
          <div className="title-row">
            <h1>Gengetone Block Party</h1>
            <div className="icon-buttons">
              <button type="button" className="icon-button" aria-label="Save to favourites" aria-pressed={saved} onClick={() => setSaved(!saved)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 21s-7.5-4.6-9.5-9.3C1 8.2 3.3 5 6.6 5c2 0 3.4 1.1 4.4 2.5C12 6.1 13.4 5 15.4 5 18.7 5 21 8.2 19.5 11.7 17.5 16.4 12 21 12 21z" />
                </svg>
              </button>
              <button type="button" className="icon-button" aria-label="Share this event" onClick={share}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18 8a3 3 0 1 0-2.8-4M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
                </svg>
              </button>
            </div>
          </div>
          <p className="meta">
            <time dateTime="2026-12-05T15:00:00+03:00">Sat 5 Dec · 3:00 pm</time> · Kasarani Annex
          </p>
          <p className="status" role="status">
            {message}
          </p>

          <h2>Line-up</h2>
          <ul className="lineup">
            <li>
              <strong>Mtaa Sound</strong>
            </li>
            <li>
              <strong>Odi Rider</strong>
            </li>
            <li>Kaka Bass</li>
            <li>DJ Shiko</li>
          </ul>

          <h2>Tickets</h2>
          <div className="tickets">
            <p className="price">KES 800</p>
            <button type="button" className="buy">
              Buy tickets
            </button>
            <button type="button" className="secondary" aria-expanded={showSeats} onClick={() => setShowSeats(!showSeats)}>
              {showSeats ? "Hide the seat map" : "Choose your seat"}
            </button>
          </div>
          {showSeats && (
            <Suspense fallback={<p className="loading">Loading the seat map…</p>}>
              <SeatMap />
            </Suspense>
          )}

          <h2>Last year</h2>
          <ul className="gallery">
            {PHOTOS.map((photo) => (
              <li key={photo.src}>
                {/* Below the fold: the browser only fetches these when they're about to scroll into view. */}
                <img src={photo.src} alt={photo.alt} width={600} height={400} loading="lazy" decoding="async" />
              </li>
            ))}
          </ul>

          <h2>Get a reminder</h2>
          <form className="reminder" onSubmit={(e) => (e.preventDefault(), setMessage("We'll email you the day before"))}>
            <label htmlFor="reminder-email">Email</label>
            <div className="reminder-row">
              <input id="reminder-email" type="email" autoComplete="email" placeholder="amina@example.com" required />
              <button type="submit">Remind me</button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
