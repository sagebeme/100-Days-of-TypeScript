import type { Act } from "./types.ts";

// TODO: headliners first, inside <strong>, then " with " and everyone else:
//   <p className="lineup"><strong>Mtaa Sound and Odi Rider</strong> with Kaka Bass and DJ Shiko</p>
// Join names with Intl.ListFormat("en-GB", { type: "conjunction" }): "A, B and C".
// Only headliners: no " with ". No headliners: no <strong>. No acts at all: render nothing (return null).
export function LineUp({ acts }: { acts: Act[] }) {
  return <p>TODO: {acts.length} acts</p>;
}
