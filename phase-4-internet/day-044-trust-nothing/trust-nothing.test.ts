import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { ForecastSchema, FareSchema, describeIssues, parseFares } from "./starter/schemas.ts";
import { fetchJson, ResponseShapeError, type Fetcher } from "./starter/fetch-json.ts";

const fareFile: unknown = JSON.parse(readFileSync(join(import.meta.dirname, "starter", "fares.json"), "utf8"));

const nairobi = {
  current: { time: "2026-09-26T00:30", temperature_2m: 16.3, apparent_temperature: 15.9, precipitation: 0, weather_code: 0, wind_speed_10m: 7.7 },
  daily: { time: ["2026-09-26"], temperature_2m_max: [28.6], temperature_2m_min: [15.0], precipitation_probability_max: [2] },
};

const goodFare = { route: "46", from: "CBD", to: "Kawangware", fareKes: 80, updated: "2026-09-20" };

function respond(body: string, status = 200): Fetcher {
  return vi.fn(async () => new Response(body, { status }));
}

describe("ForecastSchema", () => {
  it("checks the response and turns it into the app's shape", () => {
    expect(ForecastSchema.parse(nairobi)).toEqual({
      temperature: 16.3,
      feelsLike: 15.9,
      rainNow: 0,
      rainChance: 2,
      windKmh: 7.7,
      high: 28.6,
      low: 15,
      code: 0,
    });
  });

  it("rejects a temperature sent as text", () => {
    const bad = { ...nairobi, current: { ...nairobi.current, temperature_2m: "16.3" } };
    const result = ForecastSchema.safeParse(bad);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["current", "temperature_2m"]);
  });

  it("rejects a response with no daily values", () => {
    const bad = { ...nairobi, daily: { ...nairobi.daily, temperature_2m_max: [] } };
    const result = ForecastSchema.safeParse(bad);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("expected at least one day");
  });

  it("rejects negative rain and a fractional weather code", () => {
    expect(ForecastSchema.safeParse({ ...nairobi, current: { ...nairobi.current, precipitation: -1 } }).success).toBe(false);
    expect(ForecastSchema.safeParse({ ...nairobi, current: { ...nairobi.current, weather_code: 1.5 } }).success).toBe(false);
  });

  it("rejects an error body", () => {
    expect(ForecastSchema.safeParse({ error: true, reason: "nope" }).success).toBe(false);
  });
});

describe("FareSchema", () => {
  it("accepts a good fare and fills in peak", () => {
    expect(FareSchema.parse(goodFare)).toEqual({ ...goodFare, peak: false });
  });

  it("trims names and turns a numeric string into a number", () => {
    expect(FareSchema.parse({ ...goodFare, route: "  33 ", fareKes: "120" })).toMatchObject({ route: "33", fareKes: 120 });
  });

  it.each([
    [{ ...goodFare, fareKes: "about 70" }, "fareKes: fare must be a number"],
    [{ ...goodFare, fareKes: 80.5 }, "fareKes: fare must be whole shillings"],
    [{ ...goodFare, fareKes: -10 }, "fareKes: fare must be above 0"],
    [{ ...goodFare, route: "   " }, "route: route can't be empty"],
    [{ ...goodFare, to: undefined }, "to: to is missing"],
    [{ ...goodFare, peak: "yes" }, "peak: peak must be true or false"],
    [{ ...goodFare, updated: "last week" }, "updated: updated must be a date like 2026-09-01"],
    ["44 CBD-Githurai 100", "each fare must be an object with route, from, to, fareKes and updated"],
  ])("explains what's wrong with %j", (row, problem) => {
    const result = FareSchema.safeParse(row);
    expect(result.success).toBe(false);
    if (!result.success) expect(describeIssues(result.error)).toEqual([problem]);
  });

  it("reports every problem in a row, not just the first", () => {
    const result = FareSchema.safeParse({ ...goodFare, peak: "yes", updated: "last week" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(describeIssues(result.error)).toEqual([
        "peak: peak must be true or false",
        "updated: updated must be a date like 2026-09-01",
      ]);
    }
  });
});

describe("describeIssues", () => {
  it("joins nested paths with dots", () => {
    const result = z.object({ a: z.object({ b: z.number("b must be a number") }) }).safeParse({ a: { b: "x" } });
    if (!result.success) expect(describeIssues(result.error)).toEqual(["a.b: b must be a number"]);
  });
});

describe("parseFares", () => {
  it("keeps the good rows and explains the bad ones", () => {
    const { fares, rejected } = parseFares(fareFile);
    expect(fares.map((f) => f.route)).toEqual(["46", "111", "33", "237"]);
    expect(fares[1]).toEqual({ route: "111", from: "CBD", to: "Ngong", fareKes: 120, peak: true, updated: "2026-09-21" });
    expect(rejected).toEqual([
      { row: 4, problems: ["fareKes: fare must be a number"] },
      { row: 5, problems: ["route: route can't be empty"] },
      { row: 6, problems: ["peak: peak must be true or false", "updated: updated must be a date like 2026-09-01"] },
      { row: 8, problems: ["each fare must be an object with route, from, to, fareKes and updated"] },
      { row: 9, problems: ["fareKes: fare must be above 0"] },
    ]);
  });

  it("throws when the data isn't a list at all", () => {
    expect(() => parseFares({ fares: [] })).toThrow("expected a list of fares");
  });

  it("handles an empty list", () => {
    expect(parseFares([])).toEqual({ fares: [], rejected: [] });
  });
});

describe("fetchJson", () => {
  it("returns checked, typed data", async () => {
    const today = await fetchJson("https://weather.test/now", ForecastSchema, respond(JSON.stringify(nairobi)));
    expect(today.rainChance).toBe(2);
  });

  it("throws a ResponseShapeError listing the problems", async () => {
    const bad = { ...nairobi, current: { ...nairobi.current, temperature_2m: null } };
    const attempt = fetchJson("https://weather.test/now", ForecastSchema, respond(JSON.stringify(bad)));
    await expect(attempt).rejects.toBeInstanceOf(ResponseShapeError);
    await expect(attempt).rejects.toThrow("Unexpected response from https://weather.test/now: current.temperature_2m:");
    const error = await attempt.catch((e: unknown) => e);
    expect(error instanceof ResponseShapeError && error.problems).toHaveLength(1);
  });

  it("says when the body isn't JSON", async () => {
    const attempt = fetchJson("https://weather.test/now", ForecastSchema, respond("<html>busy</html>"));
    await expect(attempt).rejects.toThrow("Unexpected response from https://weather.test/now: the body isn't JSON");
  });

  it("checks the status before the shape", async () => {
    await expect(fetchJson("https://weather.test/now", ForecastSchema, respond("{}", 503))).rejects.toThrow(
      "Request failed: 503",
    );
  });
});
