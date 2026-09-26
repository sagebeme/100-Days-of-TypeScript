import type { Act } from "./types.ts";

const list = new Intl.ListFormat("en-GB", { style: "long", type: "conjunction" });

// Headliners first, in bold, then "with A, B and C". No acts announced: nothing at all.
export function LineUp({ acts }: { acts: Act[] }) {
  if (acts.length === 0) return null;
  const headliners = acts.filter((a) => a.headliner).map((a) => a.name);
  const support = acts.filter((a) => !a.headliner).map((a) => a.name);
  return (
    <p className="lineup">
      {headliners.length > 0 && <strong>{list.format(headliners)}</strong>}
      {headliners.length > 0 && support.length > 0 && " with "}
      {support.length > 0 && list.format(support)}
    </p>
  );
}
