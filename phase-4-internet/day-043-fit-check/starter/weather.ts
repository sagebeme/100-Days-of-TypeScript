export interface Place {
  name: string;
  latitude: number;
  longitude: number;
}

export const NAIROBI: Place = { name: "Nairobi", latitude: -1.2921, longitude: 36.8219 };

// Today's weather, in the shape this app wants (not the shape the API sends).
export interface Today {
  temperature: number; // °C
  feelsLike: number; // °C
  rainNow: number; // mm in the last 15 minutes
  rainChance: number; // % chance of rain at some point today
  windKmh: number;
  high: number;
  low: number;
  code: number; // WMO weather code
}

export type Fetcher = (url: string) => Promise<Response>;

export const API = "https://api.open-meteo.com/v1/forecast";

export function forecastUrl(place: Place): string {
  // TODO: build it with new URL(API) and url.searchParams.set(...):
  //   latitude, longitude (as strings),
  //   current = "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m"
  //   daily   = "temperature_2m_max,temperature_2m_min,precipitation_probability_max"
  //   timezone = "Africa/Nairobi", forecast_days = "1"
  throw new Error("not implemented yet");
}

// What Open-Meteo sends back, as far as this app cares. (Tomorrow: checking it's really this shape.)
interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
}

export async function fetchWeather(place: Place, fetchFn: Fetcher): Promise<Today> {
  // TODO: fetch forecastUrl(place), then deal with the status code:
  //   400       -> "Bad request: <reason>" (the body is JSON like { "error": true, "reason": "..." };
  //                if it isn't, use "no reason given")
  //   429       -> "Too many requests. Wait a minute and try again."
  //   500+      -> "The weather service is having problems (503). Try again later."
  //   other !ok -> "Request failed: 404"
  // TODO: read the JSON as an OpenMeteoResponse and turn it into a Today
  //   (the daily values are arrays with one entry: today's)
  throw new Error("not implemented yet");
}

// WMO weather codes, grouped the way a person would describe the sky.
export function describeSky(code: number): string {
  // TODO: 0 "Clear sky", 1-2 "Partly cloudy", 3 "Overcast", 45 or 48 "Fog", 51-57 "Drizzle",
  //       61-67 or 80-82 "Rain", 95 and up "Thunderstorm", anything else "Mixed weather"
  throw new Error("not implemented yet");
}
