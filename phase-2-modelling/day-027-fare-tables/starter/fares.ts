// TODO: add `as const` after the closing brace so the values become literal types (120, 80, 150)
export const FARE = {
  peak: 120,
  offPeak: 80,
  night: 150,
};

export type FareKind = keyof typeof FARE;

export type Fare = (typeof FARE)[FareKind];

export function fareFor(kind: FareKind): number {
  // TODO: look the fare up in FARE
  throw new Error("not implemented yet");
}

export function totalFare(rides: FareKind[]): number {
  // TODO: add up the fare of every ride
  throw new Error("not implemented yet");
}

export function isFareKind(value: string): value is FareKind {
  // TODO: true only if value is one of FARE's own keys (Object.hasOwn), so "toString" is false
  throw new Error("not implemented yet");
}
