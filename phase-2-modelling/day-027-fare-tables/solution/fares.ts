export const FARE = {
  peak: 120,
  offPeak: 80,
  night: 150,
} as const;

export type FareKind = keyof typeof FARE;

export type Fare = (typeof FARE)[FareKind];

export function fareFor(kind: FareKind): number {
  return FARE[kind];
}

export function totalFare(rides: FareKind[]): number {
  let total = 0;
  for (const ride of rides) {
    total += fareFor(ride);
  }
  return total;
}

export function isFareKind(value: string): value is FareKind {
  return Object.hasOwn(FARE, value);
}
