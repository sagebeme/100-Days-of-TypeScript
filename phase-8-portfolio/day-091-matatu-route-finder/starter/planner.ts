import type { Network } from "./network.ts";

export type Leg =
  | { kind: "ride"; route: string; from: string; to: string; stops: number; minutes: number; fare: number }
  | { kind: "walk"; from: string; to: string; minutes: number };

export interface Trip {
  legs: Leg[];
  minutes: number; // riding and walking, plus the wait at each boarding
  fare: number;
  changes: number; // rides minus one: walking isn't a change
}

export interface Options {
  changeMinutes?: number; // the wait at every boarding: default 8
  fewestChanges?: boolean;
}

// Dijkstra's shortest path. The tests are the spec.
export function planTrip(network: Network, from: string, to: string, options: Options = {}): Trip | null {
  throw new Error(`TODO: planTrip(${network.stages.length} stages, ${from}, ${to}, ${JSON.stringify(options)})`);
}

export function describe(network: Network, trip: Trip): string {
  throw new Error(`TODO: describe(${network.stages.length}, ${trip.legs.length} legs)`);
}
