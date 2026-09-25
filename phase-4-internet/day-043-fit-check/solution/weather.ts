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
  const url = new URL(API);
  url.searchParams.set("latitude", String(place.latitude));
  url.searchParams.set("longitude", String(place.longitude));
  url.searchParams.set("current", "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_probability_max");
  url.searchParams.set("timezone", "Africa/Nairobi");
  url.searchParams.set("forecast_days", "1");
  return url.toString();
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

async function errorReason(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null && "reason" in body && typeof body.reason === "string") {
      return body.reason;
    }
  } catch {
    // Not JSON: fall through.
  }
  return "no reason given";
}

export async function fetchWeather(place: Place, fetchFn: Fetcher): Promise<Today> {
  const response = await fetchFn(forecastUrl(place));

  if (response.status === 400) {
    throw new Error(`Bad request: ${await errorReason(response)}`);
  }
  if (response.status === 429) {
    throw new Error("Too many requests. Wait a minute and try again.");
  }
  if (response.status >= 500) {
    throw new Error(`The weather service is having problems (${response.status}). Try again later.`);
  }
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const data = (await response.json()) as OpenMeteoResponse;
  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    rainNow: data.current.precipitation,
    rainChance: data.daily.precipitation_probability_max[0],
    windKmh: data.current.wind_speed_10m,
    high: data.daily.temperature_2m_max[0],
    low: data.daily.temperature_2m_min[0],
    code: data.current.weather_code,
  };
}

// WMO weather codes, grouped the way a person would describe the sky.
export function describeSky(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "Rain";
  if (code >= 95) return "Thunderstorm";
  return "Mixed weather";
}
