import type { Weather, Fixture, Release } from "./sources.ts";

// Each section either worked, or explains itself. One broken source never stops the whole digest.
export type Section<T> = { ok: true; value: T } | { ok: false; reason: string };

export interface DigestInput {
  date: Date;
  team: string;
  weather: Section<Weather>;
  fixtures: Section<Fixture[]>;
  releases: Section<Release[]>;
}

// Turns Promise.allSettled's results into sections.
export function toSection<T>(result: PromiseSettledResult<T>): Section<T> {
  // TODO: fulfilled -> { ok: true, value }; rejected -> { ok: false, reason: the error's message }
  throw new Error("not implemented yet");
}

const nairobi = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Nairobi", ...options });
const longDate = nairobi({ weekday: "long", day: "numeric", month: "long" });
const kickoffTime = nairobi({ weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const DAY = 24 * 60 * 60 * 1000;

export function sky(code: number): string {
  if (code === 0) return "clear skies";
  if (code <= 3) return "some cloud";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code >= 95) return "thunderstorms";
  return "mixed weather";
}

export function fitTip(weather: Weather): string {
  if (weather.rainChance >= 60) return "Umbrella day. Leave the white sneakers at home.";
  if (weather.high - weather.low >= 10) return "Cold morning, hot afternoon: wear layers.";
  if (weather.feelsLike >= 27) return "It's a hot one. Light clothes and water.";
  return "An easy day to dress for.";
}

export function nextMatch(fixtures: Fixture[], team: string, now: Date): Fixture | null {
  // TODO: the team's (home or away, any case) earliest match that kicks off after `now`, or null
  throw new Error("not implemented yet");
}

export function thisWeeksReleases(releases: Release[], now: Date): Release[] {
  // TODO: releases from the last 7 days up to today (Nairobi's date), newest first, ties by artist A-Z
  throw new Error("not implemented yet");
}

export function formatDigest(input: DigestInput): string {
  // TODO: the message in the README, line by line:
  //   "Habari! Here's your drop for Saturday 3 October." (longDate), a blank line, then three sections:
  //   WEATHER: "<now>°C now with <sky>, <low>-<high>°C today, <n>% chance of rain." and fitTip(...)
  //   <TEAM IN CAPITALS>: "Next up: <home> vs <away>, <kickoffTime> at <venue> (<competition>)."
  //                       or "No matches coming up."
  //   NEW MUSIC THIS WEEK: "- <artist>: <title> (<kind>)" for up to 5, or "Nothing new this week."
  //   Sections are separated by a blank line. A failed section says "Unavailable today (<reason>)."
  //   (for fixtures: "Fixtures unavailable today (<reason>).")
  throw new Error("not implemented yet");
}
