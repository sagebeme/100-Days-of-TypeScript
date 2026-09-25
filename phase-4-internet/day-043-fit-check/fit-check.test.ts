import { describe, it, expect, vi } from "vitest";
import { forecastUrl, fetchWeather, describeSky, NAIROBI, type Today, type Fetcher } from "./starter/weather.ts";
import { pickOutfit, formatReport } from "./starter/outfit.ts";

// A real response from Open-Meteo for Nairobi, trimmed to the parts the app asks for.
const nairobiResponse = {
  latitude: -1.3005272,
  longitude: 36.824646,
  timezone: "Africa/Nairobi",
  current: { time: "2026-09-26T00:30", interval: 900, temperature_2m: 16.3, apparent_temperature: 15.9, precipitation: 0, weather_code: 0, wind_speed_10m: 7.7 },
  daily: { time: ["2026-09-26"], temperature_2m_max: [28.6], temperature_2m_min: [15.0], precipitation_probability_max: [2] },
};

function respond(body: unknown, status = 200): Fetcher {
  return vi.fn(async () => new Response(typeof body === "string" ? body : JSON.stringify(body), { status }));
}

const today = (overrides: Partial<Today> = {}): Today => ({
  temperature: 22,
  feelsLike: 22,
  rainNow: 0,
  rainChance: 0,
  windKmh: 5,
  high: 24,
  low: 18,
  code: 1,
  ...overrides,
});

describe("forecastUrl", () => {
  it("asks Open-Meteo for today's weather at the place", () => {
    const url = new URL(forecastUrl(NAIROBI));
    expect(url.origin + url.pathname).toBe("https://api.open-meteo.com/v1/forecast");
    expect(url.searchParams.get("latitude")).toBe("-1.2921");
    expect(url.searchParams.get("longitude")).toBe("36.8219");
    expect(url.searchParams.get("current")).toBe(
      "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    );
    expect(url.searchParams.get("daily")).toBe("temperature_2m_max,temperature_2m_min,precipitation_probability_max");
    expect(url.searchParams.get("timezone")).toBe("Africa/Nairobi");
    expect(url.searchParams.get("forecast_days")).toBe("1");
  });

  it("encodes the query string properly", () => {
    expect(forecastUrl(NAIROBI)).toContain("timezone=Africa%2FNairobi");
  });
});

describe("fetchWeather", () => {
  it("maps the API's answer into a Today", async () => {
    const fetchFn = respond(nairobiResponse);
    await expect(fetchWeather(NAIROBI, fetchFn)).resolves.toEqual({
      temperature: 16.3,
      feelsLike: 15.9,
      rainNow: 0,
      rainChance: 2,
      windKmh: 7.7,
      high: 28.6,
      low: 15,
      code: 0,
    });
    expect(fetchFn).toHaveBeenCalledWith(forecastUrl(NAIROBI));
  });

  it("passes on the API's reason for a 400", async () => {
    const fetchFn = respond({ error: true, reason: "Latitude must be in range of -90 to 90°. Given: -100.0." }, 400);
    await expect(fetchWeather({ name: "Nowhere", latitude: -100, longitude: 36 }, fetchFn)).rejects.toThrow(
      "Bad request: Latitude must be in range of -90 to 90°. Given: -100.0.",
    );
  });

  it("copes with a 400 that isn't JSON", async () => {
    await expect(fetchWeather(NAIROBI, respond("<h1>Bad</h1>", 400))).rejects.toThrow("Bad request: no reason given");
  });

  it("asks you to slow down on a 429", async () => {
    await expect(fetchWeather(NAIROBI, respond({}, 429))).rejects.toThrow(
      "Too many requests. Wait a minute and try again.",
    );
  });

  it.each([500, 502, 503])("blames the service for a %i", async (status) => {
    await expect(fetchWeather(NAIROBI, respond("oops", status))).rejects.toThrow(
      `The weather service is having problems (${status}). Try again later.`,
    );
  });

  it("reports any other failure with its status", async () => {
    await expect(fetchWeather(NAIROBI, respond({}, 404))).rejects.toThrow("Request failed: 404");
  });
});

describe("describeSky", () => {
  it.each([
    [0, "Clear sky"],
    [1, "Partly cloudy"],
    [2, "Partly cloudy"],
    [3, "Overcast"],
    [45, "Fog"],
    [48, "Fog"],
    [53, "Drizzle"],
    [63, "Rain"],
    [81, "Rain"],
    [95, "Thunderstorm"],
    [99, "Thunderstorm"],
    [71, "Mixed weather"],
  ])("code %i is %s", (code, words) => {
    expect(describeSky(code)).toBe(words);
  });
});

describe("pickOutfit", () => {
  it.each([
    [10, "Hoodie or a warm jacket"],
    [13.9, "Hoodie or a warm jacket"],
    [14, "Light sweater or a denim jacket"],
    [19.9, "Light sweater or a denim jacket"],
    [20, "T-shirt"],
    [26.9, "T-shirt"],
    [27, "Vest or a light tee"],
  ])("feels like %d°C: %s", (feelsLike, top) => {
    expect(pickOutfit(today({ feelsLike })).top).toBe(top);
  });

  it("goes for shorts on a warm, dry day", () => {
    expect(pickOutfit(today({ feelsLike: 25 })).bottom).toBe("Shorts");
  });

  it("keeps long trousers when it's cooler or rain is likely", () => {
    expect(pickOutfit(today({ feelsLike: 23 })).bottom).toBe("Jeans or chinos");
    expect(pickOutfit(today({ feelsLike: 30, rainChance: 45 })).bottom).toBe("Jeans or chinos");
    expect(pickOutfit(today({ feelsLike: 30, rainNow: 0.2 })).bottom).toBe("Jeans or chinos");
  });

  it("brings an umbrella and saves the white sneakers when it's wet", () => {
    expect(pickOutfit(today({ rainChance: 60 })).extras).toEqual(["Umbrella", "Skip the white sneakers"]);
    expect(pickOutfit(today({ rainNow: 1.5 })).extras).toEqual(["Umbrella", "Skip the white sneakers"]);
  });

  it("packs a small umbrella when rain is possible", () => {
    expect(pickOutfit(today({ rainChance: 30 })).extras).toEqual(["Pack a small umbrella"]);
    expect(pickOutfit(today({ rainChance: 29 })).extras).toEqual([]);
  });

  it("adds wind, layers and sunglasses, in that order", () => {
    const outfit = pickOutfit(today({ windKmh: 35, high: 29, low: 15, code: 0 }));
    expect(outfit.extras).toEqual(["Windbreaker", "Layers: it's cold early and warm later", "Sunglasses"]);
  });

  it("only suggests sunglasses on a clear, hot day", () => {
    expect(pickOutfit(today({ code: 0, high: 24 })).extras).toEqual([]);
    expect(pickOutfit(today({ code: 2, high: 30, low: 22 })).extras).toEqual([]);
  });
});

describe("formatReport", () => {
  it("prints the weather and the outfit", () => {
    const now = today({ temperature: 16.3, feelsLike: 15.9, rainChance: 2, high: 28.6, low: 15, code: 0 });
    expect(formatReport("Nairobi", now, pickOutfit(now))).toBe(
      [
        "Fit check for Nairobi",
        "Clear sky, 16°C (feels like 16°C)",
        "High 29°C, low 15°C, 2% chance of rain",
        "",
        "Top:    Light sweater or a denim jacket",
        "Bottom: Jeans or chinos",
        "Also:   Layers: it's cold early and warm later, Sunglasses",
      ].join("\n"),
    );
  });

  it("leaves out the extras line when there are none", () => {
    const report = formatReport("Kisumu", today(), { top: "T-shirt", bottom: "Jeans or chinos", extras: [] });
    expect(report.split("\n").at(-1)).toBe("Bottom: Jeans or chinos");
  });
});
