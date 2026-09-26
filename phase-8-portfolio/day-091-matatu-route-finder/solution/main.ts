import { NAIROBI } from "./network.ts";
import { planTrip, type Trip } from "./planner.ts";

// The page. The search is in planner.ts; this draws the trip as steps and on the map.
const $ = <T extends HTMLElement | SVGElement>(id: string) => document.getElementById(id) as unknown as T;
const net = NAIROBI;
const name = (id: string) => net.stages.find((s) => s.id === id)!.name;
const byName = [...net.stages].sort((a, b) => a.name.localeCompare(b.name));
const from = $<HTMLSelectElement>("from");
const to = $<HTMLSelectElement>("to");
for (const select of [from, to]) select.append(...byName.map((s) => new Option(s.name, s.id)));
const params = new URLSearchParams(location.search);
from.value = params.get("from") ?? "kangemi";
to.value = params.get("to") ?? "rongai";

function drawTrip(trip: Trip | null): void {
  const box = $<HTMLElement>("trip");
  if (!trip) return void (box.innerHTML = `<p class="none">No matatu goes between those two stages, even with changes and a walk.</p>`);
  if (trip.legs.length === 0) return void (box.innerHTML = `<p class="none">You're already there. Enjoy the walk to the kiosk.</p>`);
  const summary = `<dl class="summary"><div><dt>Time</dt><dd>${trip.minutes} min</dd></div><div><dt>Fare</dt><dd>KES ${trip.fare}</dd></div><div><dt>Changes</dt><dd>${trip.changes}</dd></div></dl>`;
  const legs = trip.legs
    .map((leg) => {
      if (leg.kind === "walk") return `<li class="leg"><span class="badge walk" aria-hidden="true">🚶🏾</span><div><h3>Walk to ${name(leg.to)}</h3><p>${leg.minutes} minutes on foot</p></div></li>`;
      const colour = net.routes.find((r) => r.number === leg.route)!.colour;
      return `<li class="leg" style="--c:${colour}"><span class="badge" aria-hidden="true">${leg.route}</span><div><h3>Take the ${leg.route} from ${name(leg.from)}</h3><p>Get off at ${name(leg.to)}: ${leg.stops} ${leg.stops === 1 ? "stop" : "stops"}, ${leg.minutes} min · KES ${leg.fare}</p></div></li>`;
    })
    .join("");
  box.innerHTML = `${summary}<ol class="legs">${legs}<li class="arrive"><span aria-hidden="true">📍</span>Arrive at ${name(trip.legs.at(-1)!.to)}</li></ol>`;
}

function drawMap(trip: Trip | null): void {
  const svg = $<SVGSVGElement>("map");
  const at = (id: string) => net.stages.find((s) => s.id === id)!;
  const used = new Set(trip?.legs.filter((l) => l.kind === "ride").map((l) => (l.kind === "ride" ? l.route : "")));
  const onTrip = new Set<string>();
  for (const leg of trip?.legs ?? []) {
    if (leg.kind === "walk") (onTrip.add(leg.from), onTrip.add(leg.to));
    else {
      const route = net.routes.find((r) => r.number === leg.route)!;
      const [a, b] = [route.stages.indexOf(leg.from), route.stages.indexOf(leg.to)].sort((x, y) => x - y);
      route.stages.slice(a, b + 1).forEach((s) => onTrip.add(s));
    }
  }
  const walked = new Set(trip?.legs.filter((l) => l.kind === "walk").map((l) => [l.from, l.to].sort().join("|")));
  const routes = net.routes.map((r) => `<polyline class="route ${used.has(r.number) ? "on" : ""}" stroke="${r.colour}" points="${r.stages.map((s) => `${at(s).x},${at(s).y}`).join(" ")}" />`).join("");
  const walks = net.walks.map((w) => `<line class="walk ${walked.has([...w.between].sort().join("|")) ? "on" : ""}" x1="${at(w.between[0]).x}" y1="${at(w.between[0]).y}" x2="${at(w.between[1]).x}" y2="${at(w.between[1]).y}" />`).join("");
  const stages = net.stages.map((s) => `<circle class="stage ${onTrip.has(s.id) ? "on" : ""}" cx="${s.x}" cy="${s.y}" r="${onTrip.has(s.id) ? 1.9 : 1.3}" /><text class="${onTrip.has(s.id) ? "on" : ""}" x="${s.x + 2.4}" y="${s.y + 1}">${s.name}</text>`).join("");
  svg.innerHTML = walks + routes + stages;
}

function update(): void {
  const fewest = (document.querySelector('input[name="prefer"]:checked') as HTMLInputElement).value === "fewest";
  const trip = planTrip(net, from.value, to.value, { fewestChanges: fewest });
  drawTrip(trip);
  drawMap(trip);
  history.replaceState(null, "", `?from=${from.value}&to=${to.value}`); // a link someone can share
}

$("search").addEventListener("change", update);
$("swap").addEventListener("click", () => {
  [from.value, to.value] = [to.value, from.value];
  update();
});
update();
