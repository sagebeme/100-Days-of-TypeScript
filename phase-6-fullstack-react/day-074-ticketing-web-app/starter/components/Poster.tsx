import type { CSSProperties } from "react";

// Already written: poster art, coloured by the event's id, with the date on it. Decoration only.
export function Poster({ event, large = false }: { event: { id: number; startsAt: string }; large?: boolean }) {
  const date = new Date(event.startsAt);
  const part = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Nairobi", ...options }).format(date);
  return (
    <div className={large ? "poster poster-large" : "poster"} style={{ "--h": (event.id * 67 + 250) % 360 } as CSSProperties} aria-hidden="true">
      <span className="poster-date">
        <span className="month">{part({ month: "short" }).toUpperCase()}</span>
        <span className="day">{part({ day: "numeric" })}</span>
      </span>
    </div>
  );
}
