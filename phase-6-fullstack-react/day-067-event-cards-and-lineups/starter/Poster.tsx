import type { CSSProperties } from "react";
import type { TikitiEvent } from "./types.ts";

// Already written: poster art made from the event's colour, with the date on it. It's decoration
// (the date is also written out in the card), so screen readers skip it: aria-hidden.
export function Poster({ event }: { event: TikitiEvent }) {
  const date = new Date(event.startsAt);
  const part = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Nairobi", ...options }).format(date);
  return (
    <div className="poster" style={{ "--h": event.hue } as CSSProperties} aria-hidden="true">
      <span className="tag">{event.genre}</span>
      <span className="poster-date">
        <span className="month">{part({ month: "short" }).toUpperCase()}</span>
        <span className="day">{part({ day: "numeric" })}</span>
      </span>
    </div>
  );
}
