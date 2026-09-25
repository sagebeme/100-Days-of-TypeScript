// Already written: fetch today's weather and print what to wear.
//   node phase-4-internet/day-043-fit-check/starter/cli.ts
//   node phase-4-internet/day-043-fit-check/starter/cli.ts Mombasa -4.0435 39.6682
import { fetchWeather, NAIROBI, type Place } from "./weather.ts";
import { pickOutfit, formatReport } from "./outfit.ts";

const [name, latitude, longitude] = process.argv.slice(2);
const place: Place = name ? { name, latitude: Number(latitude), longitude: Number(longitude) } : NAIROBI;

try {
  const today = await fetchWeather(place, fetch);
  console.log(formatReport(place.name, today, pickOutfit(today)));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
