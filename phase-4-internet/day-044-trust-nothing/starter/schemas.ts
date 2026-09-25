import { z } from "zod";

// ------------------------------------------------------------------
// The weather, from Day 43: now checked instead of trusted.
// ------------------------------------------------------------------

// TODO: ForecastSchema: a z.object with
//   current: temperature_2m, apparent_temperature (numbers), precipitation (number, min 0),
//            weather_code (whole number), wind_speed_10m (number, min 0)
//   daily:   temperature_2m_max, temperature_2m_min, precipitation_probability_max
//            (arrays of numbers with at least one entry: "expected at least one day")
// then .transform() it into the app's own shape:
//   { temperature, feelsLike, rainNow, rainChance, windKmh, high, low, code } (daily values: entry [0])
// (This placeholder only keeps the types working until you write the real one.)
export const ForecastSchema = z.object({}).transform(() => ({
  temperature: 0,
  feelsLike: 0,
  rainNow: 0,
  rainChance: 0,
  windKmh: 0,
  high: 0,
  low: 0,
  code: 0,
}));

// The type comes from the schema, so the two can never disagree.
export type Today = z.infer<typeof ForecastSchema>;

// ------------------------------------------------------------------
// Matatu fares: a list typed in by volunteers. Expect mess.
// ------------------------------------------------------------------

// TODO: FareSchema, with these messages (the tests check them):
//   route, from, to: trimmed strings, not empty
//       missing -> "route is missing", empty -> "route can't be empty" (and the same for from / to)
//   fareKes: z.coerce.number(), whole, above 0
//       "fare must be a number" / "fare must be whole shillings" / "fare must be above 0"
//   peak: boolean, default false -> "peak must be true or false"
//   updated: z.iso.date() -> "updated must be a date like 2026-09-01"
//   and for anything that isn't an object at all:
//       "each fare must be an object with route, from, to, fareKes and updated"
export const FareSchema = z.object({
  route: z.string(),
  from: z.string(),
  to: z.string(),
  fareKes: z.number(),
  peak: z.boolean(),
  updated: z.string(),
});

export type Fare = z.infer<typeof FareSchema>;

export interface Rejected {
  row: number; // 1 for the first row, like a person would count
  problems: string[];
}

export interface FareList {
  fares: Fare[];
  rejected: Rejected[];
}

export function describeIssues(error: z.ZodError): string[] {
  // TODO: one string per issue: "fareKes: fare must be above 0" (path joined with "."),
  //       or just the message when the path is empty
  throw new Error("not implemented yet");
}

export function parseFares(data: unknown): FareList {
  // TODO: if data isn't an array, throw "expected a list of fares"
  // TODO: safeParse every row with FareSchema; keep the good ones in `fares`,
  //       and record the bad ones in `rejected` with their row number (from 1) and problems
  throw new Error("not implemented yet");
}
