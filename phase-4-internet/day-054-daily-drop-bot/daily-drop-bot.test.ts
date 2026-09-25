import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { load, weatherUrl, WeatherSchema, type Fixture, type Release, type Weather, type Fetcher } from "./starter/sources.ts";
import { toSection, nextMatch, thisWeeksReleases, formatDigest, sky, fitTip, type DigestInput } from "./starter/digest.ts";
import { telegramMessenger, fitToLimit, TELEGRAM_LIMIT, type Messenger } from "./starter/telegram.ts";
import { loadBotConfig, sendDigest, nextRunAt, runDaily } from "./starter/bot.ts";

const NOW = new Date("2026-10-03T04:00:00Z"); // Saturday 3 October, 07:00 in Nairobi

const weatherBody = {
  current: { temperature_2m: 16.3, apparent_temperature: 15.9, weather_code: 2 },
  daily: { temperature_2m_max: [28.6], temperature_2m_min: [15.0], precipitation_probability_max: [20] },
};
const weather: Weather = { now: 16.3, feelsLike: 15.9, high: 28.6, low: 15, rainChance: 20, code: 2 };

const fixtures: Fixture[] = [
  { competition: "FKF Premier League", home: "Gor Mahia", away: "AFC Leopards", kickoff: "2026-10-04T12:00:00Z", venue: "Nyayo National Stadium" },
  { competition: "FKF Premier League", home: "Tusker", away: "Gor Mahia", kickoff: "2026-10-11T13:00:00Z", venue: "Ruaraka Grounds" },
  { competition: "FKF Premier League", home: "Gor Mahia", away: "Bandari", kickoff: "2026-09-27T12:00:00Z", venue: "Nyayo National Stadium" },
];

const releases: Release[] = [
  { artist: "Nyashinski", title: "Practice Track", kind: "single", released: "2026-10-02" },
  { artist: "Bien", title: "Made-Up Single", kind: "single", released: "2026-10-02" },
  { artist: "Nviiri the Storyteller", title: "Sample EP", kind: "EP", released: "2026-09-29" },
  { artist: "Jioni Jazz", title: "An Old Album", kind: "album", released: "2026-08-15" },
  { artist: "Future Artist", title: "Not Out Yet", kind: "single", released: "2026-10-09" },
];

const input = (overrides: Partial<DigestInput> = {}): DigestInput => ({
  date: NOW,
  team: "Gor Mahia",
  weather: { ok: true, value: weather },
  fixtures: { ok: true, value: fixtures },
  releases: { ok: true, value: releases },
  ...overrides,
});

describe("load", () => {
  const readFile = async (path: string) => {
    if (path === "fixtures.json") return JSON.stringify(fixtures);
    throw new Error(`ENOENT: ${path}`);
  };

  it("fetches URLs and checks them with the schema", async () => {
    const fetchFn = vi.fn<Fetcher>(async () => new Response(JSON.stringify(weatherBody)));
    expect(await load(weatherUrl(-1.29, 36.82), WeatherSchema, fetchFn, readFile)).toEqual(weather);
    expect(new Headers(fetchFn.mock.calls[0][1]?.headers).get("Accept")).toBe("application/json");
  });

  it("reads local files for practice data", async () => {
    const fetchFn = vi.fn<Fetcher>();
    expect(await load("fixtures.json", z.array(z.unknown()), fetchFn, readFile)).toHaveLength(3);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("names the host when a request fails", async () => {
    const fetchFn = vi.fn<Fetcher>(async () => new Response("", { status: 503 }));
    await expect(load("https://music.example/new.json", z.unknown(), fetchFn, readFile)).rejects.toThrow("music.example answered 503");
  });

  it("rejects data of the wrong shape", async () => {
    const fetchFn = vi.fn<Fetcher>(async () => new Response('{"weather":"nice"}'));
    await expect(load("https://weather.example/", WeatherSchema, fetchFn, readFile)).rejects.toThrow();
  });
});

describe("the digest's parts", () => {
  it("turns settled promises into sections", async () => {
    const [good, bad] = await Promise.allSettled([Promise.resolve(1), Promise.reject(new Error("feed is down"))]);
    expect(toSection(good)).toEqual({ ok: true, value: 1 });
    expect(toSection(bad)).toEqual({ ok: false, reason: "feed is down" });
  });

  it("finds the team's next match, not a past one", () => {
    expect(nextMatch(fixtures, "gor mahia", NOW)?.away).toBe("AFC Leopards");
    expect(nextMatch(fixtures, "Gor Mahia", new Date("2026-10-05T00:00:00Z"))?.home).toBe("Tusker");
    expect(nextMatch(fixtures, "Gor Mahia", new Date("2026-12-01T00:00:00Z"))).toBeNull();
  });

  it("keeps this week's releases, newest first", () => {
    expect(thisWeeksReleases(releases, NOW).map((r) => r.title)).toEqual(["Made-Up Single", "Practice Track", "Sample EP"]);
  });

  it("describes the sky and suggests what to wear", () => {
    expect(sky(0)).toBe("clear skies");
    expect(sky(63)).toBe("rain");
    expect(fitTip({ ...weather, rainChance: 70 })).toBe("Umbrella day. Leave the white sneakers at home.");
    expect(fitTip(weather)).toBe("Cold morning, hot afternoon: wear layers.");
  });
});

describe("formatDigest", () => {
  it("writes the whole morning drop", () => {
    expect(formatDigest(input())).toBe(
      [
        "Habari! Here's your drop for Saturday 3 October.",
        "",
        "WEATHER",
        "16°C now with some cloud, 15-29°C today, 20% chance of rain.",
        "Cold morning, hot afternoon: wear layers.",
        "",
        "GOR MAHIA",
        "Next up: Gor Mahia vs AFC Leopards, Sun 4 Oct, 15:00 at Nyayo National Stadium (FKF Premier League).",
        "",
        "NEW MUSIC THIS WEEK",
        "- Bien: Made-Up Single (single)",
        "- Nyashinski: Practice Track (single)",
        "- Nviiri the Storyteller: Sample EP (EP)",
      ].join("\n"),
    );
  });

  it("still sends the rest when a source is down", () => {
    const text = formatDigest(
      input({ weather: { ok: false, reason: "api.open-meteo.com answered 503" }, releases: { ok: true, value: [] } }),
    );
    expect(text).toContain("WEATHER\nUnavailable today (api.open-meteo.com answered 503).");
    expect(text).toContain("Next up: Gor Mahia vs AFC Leopards");
    expect(text).toContain("NEW MUSIC THIS WEEK\nNothing new this week.");
  });

  it("says when there are no matches or no fixtures", () => {
    expect(formatDigest(input({ team: "Shabana" }))).toContain("SHABANA\nNo matches coming up.");
    expect(formatDigest(input({ fixtures: { ok: false, reason: "file missing" } }))).toContain(
      "Fixtures unavailable today (file missing).",
    );
  });
});

describe("telegramMessenger", () => {
  it("sends the message to the chat, without link previews", async () => {
    const fetchFn = vi.fn<Fetcher>(async () => new Response('{"ok":true,"result":{}}'));
    await telegramMessenger("123456:ABC-DEF_secret", "987654", fetchFn).send("Habari!");
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://api.telegram.org/bot123456:ABC-DEF_secret/sendMessage");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ chat_id: "987654", text: "Habari!", link_preview_options: { is_disabled: true } });
  });

  it("explains a refusal without leaking the token", async () => {
    const fetchFn = vi.fn<Fetcher>(async () => new Response('{"ok":false,"error_code":400,"description":"Bad Request: chat not found"}', { status: 400 }));
    const error = await telegramMessenger("123456:SECRET", "1", fetchFn).send("x").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("Telegram didn't accept the message: Bad Request: chat not found");
    expect((error as Error).message).not.toContain("SECRET");
  });

  it("keeps messages under Telegram's limit", () => {
    expect(fitToLimit("short")).toBe("short");
    const long = fitToLimit("a".repeat(5000));
    expect(long).toHaveLength(TELEGRAM_LIMIT);
    expect(long.endsWith("…")).toBe(true);
  });
});

describe("config", () => {
  it("has sensible defaults", () => {
    expect(loadBotConfig({})).toMatchObject({ TEAM: "Gor Mahia", SEND_AT: "07:00", LATITUDE: -1.2921 });
  });

  it("lists every problem at once", () => {
    const message = (() => {
      try {
        loadBotConfig({ SEND_AT: "7am", LATITUDE: "200", TELEGRAM_CHAT_ID: "1" });
        return "";
      } catch (error) {
        return (error as Error).message;
      }
    })();
    expect(message).toContain("SEND_AT: SEND_AT must be a time like 07:00");
    expect(message).toContain("LATITUDE:");
    expect(message).toContain("Set both TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID, or neither");
  });

  it("needs both Telegram settings, or neither", () => {
    expect(() => loadBotConfig({ TELEGRAM_BOT_TOKEN: "123456:ABCDEFGHIJKLMNOPQRSTU" })).toThrow("Set both");
    expect(loadBotConfig({ TELEGRAM_BOT_TOKEN: "123456:ABCDEFGHIJKLMNOPQRSTU", TELEGRAM_CHAT_ID: "42" }).TELEGRAM_CHAT_ID).toBe("42");
  });
});

describe("sendDigest", () => {
  function deps(fetchFn: Fetcher) {
    const sent: string[] = [];
    const messenger: Messenger = { send: async (text) => void sent.push(text) };
    const readFile = async (path: string) => JSON.stringify(path === "fixtures.json" ? fixtures : releases);
    return { sent, deps: { fetchFn, readFile, messenger, now: () => NOW } };
  }

  it("gathers everything at once and sends one message", async () => {
    let inFlight = 0;
    let most = 0;
    const fetchFn: Fetcher = async () => {
      most = Math.max(most, ++inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight--;
      return new Response(JSON.stringify(weatherBody));
    };
    const { sent, deps: d } = deps(fetchFn);
    const slowFile = async (path: string) => {
      most = Math.max(most, ++inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight--;
      return d.readFile(path);
    };
    const text = await sendDigest(loadBotConfig({}), { ...d, readFile: slowFile });
    expect(sent).toEqual([text]);
    expect(text).toContain("Next up: Gor Mahia vs AFC Leopards");
    expect(most).toBe(3); // all three sources were being loaded at the same moment
  });

  it("sends anyway when the weather service is down", async () => {
    const { sent, deps: d } = deps(async () => new Response("", { status: 503 }));
    await sendDigest(loadBotConfig({}), d);
    expect(sent[0]).toContain("Unavailable today (api.open-meteo.com answered 503).");
    expect(sent[0]).toContain("- Bien: Made-Up Single (single)");
  });
});

describe("scheduling", () => {
  it("finds the next 07:00 in Nairobi", () => {
    expect(nextRunAt(new Date("2026-10-03T02:00:00Z"), "07:00").toISOString()).toBe("2026-10-03T04:00:00.000Z");
    expect(nextRunAt(new Date("2026-10-03T04:00:00Z"), "07:00").toISOString()).toBe("2026-10-04T04:00:00.000Z");
    expect(nextRunAt(new Date("2026-10-03T22:30:00Z"), "07:00").toISOString()).toBe("2026-10-04T04:00:00.000Z");
    expect(nextRunAt(new Date("2026-10-03T02:00:00Z"), "18:30").toISOString()).toBe("2026-10-03T15:30:00.000Z");
  });

  it("sends a drop every day at the same time", async () => {
    let now = new Date("2026-10-03T02:00:00Z");
    const timers: { run: () => void; ms: number }[] = [];
    const sent: string[] = [];
    const logs: string[] = [];
    runDaily(
      loadBotConfig({}),
      {
        fetchFn: async () => new Response(JSON.stringify(weatherBody)),
        readFile: async () => "[]",
        messenger: { send: async (text) => void sent.push(text) },
        now: () => now,
        log: (line) => logs.push(line),
      },
      { setTimeout: (run, ms) => timers.push({ run, ms }) },
    );
    expect(timers[0].ms).toBe(2 * 60 * 60 * 1000);
    expect(logs[0]).toBe("Next drop at 2026-10-03T04:00:00.000Z");

    now = new Date("2026-10-03T04:00:00Z");
    timers[0].run();
    await vi.waitFor(() => expect(timers).toHaveLength(2));
    expect(sent).toHaveLength(1);
    expect(logs).toContain("Drop sent.");
    expect(timers[1].ms).toBe(24 * 60 * 60 * 1000);
  });
});
