import type { CSSProperties } from "react";
import type { TikitiEvent } from "../lib/events.ts";

// Already written: poster art from the event's colour. Decoration only, so screen readers skip it.
export function Poster({ event, large = false }: { event: Pick<TikitiEvent, "hue" | "genre" | "startsAt">; large?: boolean }) {
  const date = new Date(event.startsAt);
  const part = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Nairobi", ...options }).format(date);
  return (
    <div className={large ? "poster poster-large" : "poster"} style={{ "--h": event.hue } as CSSProperties} aria-hidden="true">
      <span className="tag">{event.genre}</span>
      <span className="poster-date">
        <span className="month">{part({ month: "short" }).toUpperCase()}</span>
        <span className="day">{part({ day: "numeric" })}</span>
      </span>
    </div>
  );
}
