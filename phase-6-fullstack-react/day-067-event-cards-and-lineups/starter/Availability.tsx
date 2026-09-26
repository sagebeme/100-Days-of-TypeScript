import { availability } from "./format.ts";
import type { TikitiEvent } from "./types.ts";

// TODO: <span className="badge" data-tone={tone}>{label}</span>, from availability(event).
// The colour comes from the data-tone attribute in tikiti.css; the words say it too.
export function Availability({ event }: { event: Pick<TikitiEvent, "status" | "available" | "capacity"> }) {
  void availability;
  return <span>TODO: {event.available} seats</span>;
}
