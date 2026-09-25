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
  return result.status === "fulfilled"
    ? { ok: true, value: result.value }
    : { ok: false, reason: result.reason instanceof Error ? result.reason.message : String(result.reason) };
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
  const wanted = team.toLowerCase();
  return (
    fixtures
      .filter((f) => (f.home.toLowerCase() === wanted || f.away.toLowerCase() === wanted) && new Date(f.kickoff) > now)
      .sort((a, b) => a.kickoff.localeCompare(b.kickoff))[0] ?? null
  );
}

export function thisWeeksReleases(releases: Release[], now: Date): Release[] {
  const weekAgo = new Date(now.getTime() - 7 * DAY).toISOString().slice(0, 10);
  const today = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10); // Nairobi's date
  return releases
    .filter((r) => r.released >= weekAgo && r.released <= today)
    .sort((a, b) => b.released.localeCompare(a.released) || a.artist.localeCompare(b.artist));
}

export function formatDigest(input: DigestInput): string {
  const lines = [`Habari! Here's your drop for ${longDate.format(input.date)}.`, ""];

  lines.push("WEATHER");
  if (input.weather.ok) {
    const w = input.weather.value;
    lines.push(
      `${Math.round(w.now)}°C now with ${sky(w.code)}, ${Math.round(w.low)}-${Math.round(w.high)}°C today, ${w.rainChance}% chance of rain.`,
      fitTip(w),
    );
  } else {
    lines.push(`Unavailable today (${input.weather.reason}).`);
  }

  lines.push("", `${input.team.toUpperCase()}`);
  if (input.fixtures.ok) {
    const match = nextMatch(input.fixtures.value, input.team, input.date);
    lines.push(
      match
        ? `Next up: ${match.home} vs ${match.away}, ${kickoffTime.format(new Date(match.kickoff))} at ${match.venue} (${match.competition}).`
        : "No matches coming up.",
    );
  } else {
    lines.push(`Fixtures unavailable today (${input.fixtures.reason}).`);
  }

  lines.push("", "NEW MUSIC THIS WEEK");
  if (input.releases.ok) {
    const fresh = thisWeeksReleases(input.releases.value, input.date).slice(0, 5);
    if (fresh.length === 0) lines.push("Nothing new this week.");
    for (const r of fresh) lines.push(`- ${r.artist}: ${r.title} (${r.kind})`);
  } else {
    lines.push(`Unavailable today (${input.releases.reason}).`);
  }

  return lines.join("\n");
}
