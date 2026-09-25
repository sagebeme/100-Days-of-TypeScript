import { z } from "zod";

// ------------------------------------------------------------------
// The weather, from Day 43: now checked instead of trusted.
// ------------------------------------------------------------------
const todayOnly = z.array(z.number()).min(1, "expected at least one day");

export const ForecastSchema = z
  .object({
    current: z.object({
      temperature_2m: z.number(),
      apparent_temperature: z.number(),
      precipitation: z.number().min(0),
      weather_code: z.number().int(),
      wind_speed_10m: z.number().min(0),
    }),
    daily: z.object({
      temperature_2m_max: todayOnly,
      temperature_2m_min: todayOnly,
      precipitation_probability_max: todayOnly,
    }),
  })
  // Checking and renaming in one step: what comes out is already in the app's own shape.
  .transform((data) => ({
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    rainNow: data.current.precipitation,
    rainChance: data.daily.precipitation_probability_max[0],
    windKmh: data.current.wind_speed_10m,
    high: data.daily.temperature_2m_max[0],
    low: data.daily.temperature_2m_min[0],
    code: data.current.weather_code,
  }));

// The type comes from the schema, so the two can never disagree.
export type Today = z.infer<typeof ForecastSchema>;

// ------------------------------------------------------------------
// Matatu fares: a list typed in by volunteers. Expect mess.
// ------------------------------------------------------------------
export const FareSchema = z.object({
  route: z.string({ error: "route is missing" }).trim().min(1, "route can't be empty"),
  from: z.string({ error: "from is missing" }).trim().min(1, "from can't be empty"),
  to: z.string({ error: "to is missing" }).trim().min(1, "to can't be empty"),
  // People type "80" as often as 80, so a numeric string is accepted and turned into a number.
  fareKes: z.coerce
    .number({ error: "fare must be a number" })
    .int("fare must be whole shillings")
    .positive("fare must be above 0"),
  peak: z.boolean({ error: "peak must be true or false" }).default(false),
  updated: z.iso.date({ error: "updated must be a date like 2026-09-01" }),
}, { error: "each fare must be an object with route, from, to, fareKes and updated" });

export type Fare = z.infer<typeof FareSchema>;

export interface Rejected {
  row: number; // 1 for the first row, like a person would count
  problems: string[];
}

export interface FareList {
  fares: Fare[];
  rejected: Rejected[];
}

// "fareKes: fare must be above 0". An issue with no path is about the whole value.
export function describeIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => (issue.path.length > 0 ? `${issue.path.join(".")}: ${issue.message}` : issue.message));
}

// Keep every good row and explain every bad one, instead of throwing the whole list away.
export function parseFares(data: unknown): FareList {
  const list = z.array(z.unknown(), { error: "expected a list of fares" }).safeParse(data);
  if (!list.success) {
    throw new Error(describeIssues(list.error).join("; "));
  }

  const fares: Fare[] = [];
  const rejected: Rejected[] = [];
  list.data.forEach((row, index) => {
    const result = FareSchema.safeParse(row);
    if (result.success) {
      fares.push(result.data);
    } else {
      rejected.push({ row: index + 1, problems: describeIssues(result.error) });
    }
  });
  return { fares, rejected };
}
