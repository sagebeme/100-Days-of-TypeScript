// Already written: check the volunteers' fare list and the live weather.
//   node phase-4-internet/day-044-trust-nothing/starter/cli.ts
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseFares, ForecastSchema } from "./schemas.ts";
import { fetchJson, ResponseShapeError } from "./fetch-json.ts";

const raw: unknown = JSON.parse(await readFile(join(import.meta.dirname, "fares.json"), "utf8"));
const { fares, rejected } = parseFares(raw);

console.log(`${fares.length} fares you can trust:`);
for (const fare of fares) {
  console.log(`  ${fare.route.padEnd(4)} ${`${fare.from} → ${fare.to}`.padEnd(20)} KES ${fare.fareKes}${fare.peak ? " (peak)" : ""}`);
}
console.log(`\n${rejected.length} rows sent back to the volunteers:`);
for (const bad of rejected) {
  console.log(`  row ${bad.row}: ${bad.problems.join("; ")}`);
}

const url =
  "https://api.open-meteo.com/v1/forecast?latitude=-1.2921&longitude=36.8219" +
  "&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m" +
  "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Africa%2FNairobi&forecast_days=1";
try {
  const today = await fetchJson(url, ForecastSchema, fetch);
  console.log(`\nNairobi right now: ${today.temperature}°C, ${today.rainChance}% chance of rain (checked by Zod)`);
} catch (error) {
  console.error(error instanceof ResponseShapeError ? error.problems : error);
}
