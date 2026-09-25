import { z } from "zod";

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

// ------------------------------------------------------------------
// The three sources, each checked at the border (Day 44).
// ------------------------------------------------------------------
export const WeatherSchema = z
  .object({
    current: z.object({ temperature_2m: z.number(), apparent_temperature: z.number(), weather_code: z.number().int() }),
    daily: z.object({
      temperature_2m_max: z.array(z.number()).min(1),
      temperature_2m_min: z.array(z.number()).min(1),
      precipitation_probability_max: z.array(z.number()).min(1),
    }),
  })
  .transform((d) => ({
    now: d.current.temperature_2m,
    feelsLike: d.current.apparent_temperature,
    high: d.daily.temperature_2m_max[0],
    low: d.daily.temperature_2m_min[0],
    rainChance: d.daily.precipitation_probability_max[0],
    code: d.current.weather_code,
  }));
export type Weather = z.infer<typeof WeatherSchema>;

export const FixtureSchema = z.object({
  competition: z.string(),
  home: z.string(),
  away: z.string(),
  kickoff: z.iso.datetime({ offset: true }),
  venue: z.string(),
});
export type Fixture = z.infer<typeof FixtureSchema>;

export const ReleaseSchema = z.object({
  artist: z.string(),
  title: z.string(),
  kind: z.enum(["single", "EP", "album"]),
  released: z.iso.date(),
});
export type Release = z.infer<typeof ReleaseSchema>;

export function weatherUrl(latitude: number, longitude: number): string {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "temperature_2m,apparent_temperature,weather_code");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_probability_max");
  url.searchParams.set("timezone", "Africa/Nairobi");
  url.searchParams.set("forecast_days", "1");
  return url.toString();
}

// Reads JSON from a URL, or from a local file for practice data. Always checked with a schema.
export async function load<Schema extends z.ZodType>(
  source: string,
  schema: Schema,
  fetchFn: Fetcher,
  readFile: (path: string) => Promise<string>,
): Promise<z.output<Schema>> {
  let data: unknown;
  if (/^https?:\/\//.test(source)) {
    const response = await fetchFn(source, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`${new URL(source).host} answered ${response.status}`);
    data = await response.json();
  } else {
    data = JSON.parse(await readFile(source));
  }
  return schema.parse(data);
}
