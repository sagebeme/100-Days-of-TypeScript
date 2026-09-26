import { MinHeap } from "./heap.ts";
import type { Network, Route } from "./network.ts";

export type Leg =
  | { kind: "ride"; route: string; from: string; to: string; stops: number; minutes: number; fare: number }
  | { kind: "walk"; from: string; to: string; minutes: number };

export interface Trip {
  legs: Leg[];
  minutes: number; // riding and walking, plus waiting at each change
  fare: number;
  changes: number; // times you get onto another matatu: rides minus one (walking isn't a change)
}

export interface Options {
  changeMinutes?: number; // the wait you expect every time you board: default 8
  fewestChanges?: boolean; // a change costs an extra 30 minutes in the search, so fewer win
}

// Where you are in the search: at a stage, and either on a matatu (which route) or on foot.
interface State {
  stage: string;
  on: string | null; // a route number, or null when not on a matatu
}
const key = (s: State) => `${s.stage}|${s.on ?? ""}`;

interface Edge {
  to: State;
  cost: number; // what the search minimises
  minutes: number;
  fare: number;
  step: { kind: "ride"; route: Route } | { kind: "walk" } | { kind: "board"; route: Route } | { kind: "alight" };
}

// Dijkstra's shortest path, over states rather than stages: boarding a matatu has a cost (the wait,
// and the fare), riding along it costs its minutes, and getting off is free. That's how changes and
// fares are counted properly.
export function planTrip(network: Network, from: string, to: string, options: Options = {}): Trip | null {
  const ids = new Set(network.stages.map((s) => s.id));
  if (!ids.has(from) || !ids.has(to)) throw new Error(`There's no stage called ${!ids.has(from) ? from : to}`);
  if (from === to) return { legs: [], minutes: 0, fare: 0, changes: 0 };
  const wait = options.changeMinutes ?? 8;
  const penalty = options.fewestChanges ? 30 : 0;

  const edges = (state: State): Edge[] => {
    const out: Edge[] = [];
    if (state.on === null) {
      for (const route of network.routes) {
        if (route.stages.includes(state.stage)) out.push({ to: { stage: state.stage, on: route.number }, cost: wait + penalty, minutes: wait, fare: route.fare, step: { kind: "board", route } });
      }
      for (const walk of network.walks) {
        const [a, b] = walk.between;
        const other = a === state.stage ? b : b === state.stage ? a : null;
        if (other) out.push({ to: { stage: other, on: null }, cost: walk.minutes + penalty / 2, minutes: walk.minutes, fare: 0, step: { kind: "walk" } });
      }
    } else {
      const route = network.routes.find((r) => r.number === state.on)!;
      const i = route.stages.indexOf(state.stage);
      for (const j of [i - 1, i + 1]) {
        if (j < 0 || j >= route.stages.length) continue;
        const minutes = route.minutes[Math.min(i, j)];
        out.push({ to: { stage: route.stages[j], on: route.number }, cost: minutes, minutes, fare: 0, step: { kind: "ride", route } });
      }
      out.push({ to: { stage: state.stage, on: null }, cost: 0, minutes: 0, fare: 0, step: { kind: "alight" } });
    }
    return out;
  };

  const start: State = { stage: from, on: null };
  const best = new Map<string, number>([[key(start), 0]]);
  const came = new Map<string, { prev: State; edge: Edge }>();
  const queue = new MinHeap<{ state: State; cost: number }>((a, b) => a.cost < b.cost);
  queue.push({ state: start, cost: 0 });
  let goal: State | null = null;

  while (queue.size) {
    const { state, cost } = queue.pop()!;
    if (cost > (best.get(key(state)) ?? Infinity)) continue; // an old, worse entry
    if (state.stage === to && state.on === null) {
      goal = state;
      break;
    }
    for (const edge of edges(state)) {
      const next = cost + edge.cost;
      if (next < (best.get(key(edge.to)) ?? Infinity)) {
        best.set(key(edge.to), next);
        came.set(key(edge.to), { prev: state, edge });
        queue.push({ state: edge.to, cost: next });
      }
    }
  }
  if (!goal) return null;

  // Walk back from the goal to the start, then turn the steps into legs.
  const steps: { from: State; edge: Edge }[] = [];
  for (let s: State = goal; key(s) !== key(start); ) {
    const { prev, edge } = came.get(key(s))!;
    steps.unshift({ from: prev, edge });
    s = prev;
  }
  const legs: Leg[] = [];
  let minutes = 0;
  let fare = 0;
  for (const { from: at, edge } of steps) {
    minutes += edge.minutes;
    fare += edge.fare;
    const last = legs.at(-1);
    if (edge.step.kind === "board") legs.push({ kind: "ride", route: edge.step.route.number, from: at.stage, to: at.stage, stops: 0, minutes: 0, fare: edge.fare });
    else if (edge.step.kind === "ride" && last?.kind === "ride") legs[legs.length - 1] = { ...last, to: edge.to.stage, stops: last.stops + 1, minutes: last.minutes + edge.minutes };
    else if (edge.step.kind === "walk") legs.push({ kind: "walk", from: at.stage, to: edge.to.stage, minutes: edge.minutes });
  }
  return { legs, minutes, fare, changes: Math.max(0, legs.filter((l) => l.kind === "ride").length - 1) };
}

// "Take the 46 from Kencom to Westlands (2 stops, 20 min, KES 70), then walk…"
export function describe(network: Network, trip: Trip): string {
  const name = (id: string) => network.stages.find((s) => s.id === id)?.name ?? id;
  if (trip.legs.length === 0) return "You're already there.";
  const parts = trip.legs.map((leg) =>
    leg.kind === "walk"
      ? `walk from ${name(leg.from)} to ${name(leg.to)} (${leg.minutes} min)`
      : `take the ${leg.route} from ${name(leg.from)} to ${name(leg.to)} (${leg.stops} ${leg.stops === 1 ? "stop" : "stops"}, ${leg.minutes} min, KES ${leg.fare})`,
  );
  const text = parts.join(", then ");
  return `${text[0].toUpperCase()}${text.slice(1)}. About ${trip.minutes} minutes, KES ${trip.fare} in all.`;
}
