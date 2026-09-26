import { useState } from "react";
import SeatMap from "./SeatMap.tsx";
import posterUrl from "./poster.svg";
import crowd1 from "./crowd-1.svg";
import crowd2 from "./crowd-2.svg";
import crowd3 from "./crowd-3.svg";

// TODO: this page looks fine, and is broken for a lot of people. Run the audit (npm test -- day-073)
// and fix what it finds. Then look for what an audit can't see: can you buy with only a keyboard?
// And is the seat map, which most fans never open, in the download everyone waits for?

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
        <img className="poster" src={posterUrl} />
        <div className="content">
          <div className="title-row">
            <h1>Gengetone Block Party</h1>
            <div className="icon-buttons">
              <button type="button" className="icon-button" aria-pressed={saved} onClick={() => setSaved(!saved)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 21s-7.5-4.6-9.5-9.3C1 8.2 3.3 5 6.6 5c2 0 3.4 1.1 4.4 2.5C12 6.1 13.4 5 15.4 5 18.7 5 21 8.2 19.5 11.7 17.5 16.4 12 21 12 21z" />
                </svg>
              </button>
              <button type="button" className="icon-button" onClick={share}>
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

          <h4>Line-up</h4>
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
            <div className="buy" tabIndex={1} onClick={() => setMessage("Buying comes in Day 74")}>
              Buy tickets
            </div>
            <button type="button" className="secondary" aria-expanded={showSeats} onClick={() => setShowSeats(!showSeats)}>
              {showSeats ? "Hide the seat map" : "Choose your seat"}
            </button>
          </div>
          {showSeats && (
            <SeatMap />
          )}

          <h2>Last year</h2>
          <ul className="gallery">
            {PHOTOS.map((photo) => (
              <li key={photo.src}>
                <img src={photo.src} />
              </li>
            ))}
          </ul>

          <h2>Get a reminder</h2>
          <form className="reminder" onSubmit={(e) => (e.preventDefault(), setMessage("We'll email you the day before"))}>
            <div className="reminder-row">
              <input type="email" placeholder="Your email" required />
              <button type="submit">Remind me</button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
