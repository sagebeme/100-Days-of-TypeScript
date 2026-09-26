import { availability } from "./format.ts";
import type { TikitiEvent } from "./types.ts";

// A coloured badge. The colour is never the only signal: the words say it too.
export function Availability({ event }: { event: Pick<TikitiEvent, "status" | "available" | "capacity"> }) {
  const { tone, label } = availability(event);
  return (
    <span className="badge" data-tone={tone}>
      {label}
    </span>
  );
}
