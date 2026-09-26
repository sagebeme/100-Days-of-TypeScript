import { describe, it, expect } from "vitest";
import { localDay, addDays, daysBetween, toggle, currentStreak, longestStreak, completionRate, weekGrid, milestone, type Habit } from "./starter/streaks.ts";
import { strategyFor, cachesToDelete, APP_SHELL, VERSION } from "./starter/offline.ts";

const habit = (checkins: string[], createdOn = "2026-11-01"): Habit => ({ id: "h", name: "Water", emoji: "💧", checkins, createdOn });

describe("days", () => {
  it("are the calendar day where the person is, not in UTC", () => {
    const lateNight = new Date("2026-12-05T21:30:00Z"); // 00:30 on the 6th in Nairobi
    expect(localDay(lateNight, "Africa/Nairobi")).toBe("2026-12-06");
    expect(localDay(lateNight, "America/New_York")).toBe("2026-12-05");
  });

  it("add and count across months, years and clock changes", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30"); // Europe's clocks change on the 29th
    expect(daysBetween("2026-12-01", "2026-12-25")).toBe(24);
  });
});

describe("checking in", () => {
  it("adds and removes a day, keeping them sorted and unique", () => {
    const h = toggle(toggle(habit(["2026-12-03"]), "2026-12-01", "2026-12-05"), "2026-12-05", "2026-12-05");
    expect(h.checkins).toEqual(["2026-12-01", "2026-12-03", "2026-12-05"]);
    expect(toggle(h, "2026-12-03", "2026-12-05").checkins).toEqual(["2026-12-01", "2026-12-05"]);
  });

  it("can't check in to a day that hasn't happened", () => {
    expect(() => toggle(habit([]), "2026-12-06", "2026-12-05")).toThrow(/hasn't happened/);
  });
});

describe("streaks", () => {
  const run = (from: string, days: number) => Array.from({ length: days }, (_, i) => addDays(from, i));

  it("counts the days in a row up to today", () => {
    expect(currentStreak(run("2026-12-01", 5), "2026-12-05")).toBe(5);
  });

  it("keeps yesterday's streak alive until today is over", () => {
    expect(currentStreak(run("2026-12-01", 4), "2026-12-05")).toBe(4);
  });

  it("is broken by a missed day", () => {
    expect(currentStreak(run("2026-12-01", 3), "2026-12-05")).toBe(0); // last check-in on the 3rd
    expect(currentStreak(["2026-12-01", "2026-12-02", "2026-12-04", "2026-12-05"], "2026-12-05")).toBe(2);
  });

  it("remembers the longest run ever", () => {
    expect(longestStreak([...run("2026-11-01", 7), ...run("2026-11-20", 3), "2026-11-30"])).toBe(7);
    expect(longestStreak(["2026-11-03", "2026-11-03", "2026-11-04"])).toBe(2);
    expect(longestStreak([])).toBe(0);
  });

  it("celebrates milestones", () => {
    expect(milestone(7)).toBe("A whole week!");
    expect(milestone(8)).toBeNull();
  });
});

describe("completion", () => {
  it("is the share of the last 30 days done, counting today", () => {
    expect(completionRate(habit(Array.from({ length: 15 }, (_, i) => addDays("2026-11-06", i * 2)), "2026-01-01"), "2026-12-05")).toBe(0.5);
  });

  it("only counts from when the habit began", () => {
    expect(completionRate(habit(["2026-12-04", "2026-12-05"], "2026-12-02"), "2026-12-05")).toBe(0.5); // 2 of 4 days
  });
});

describe("the grid", () => {
  it("shows 12 weeks as columns of Monday to Sunday, ending with this week", () => {
    const grid = weekGrid(["2026-12-02"], "2026-12-03"); // a Thursday
    expect(grid).toHaveLength(12);
    expect(grid.every((week) => week.length === 7)).toBe(true);
    const thisWeek = grid.at(-1)!;
    expect(thisWeek.map((d) => d.day)).toEqual(["2026-11-30", "2026-12-01", "2026-12-02", "2026-12-03", "2026-12-04", "2026-12-05", "2026-12-06"]);
    expect(thisWeek[2]).toEqual({ day: "2026-12-02", done: true, future: false });
    expect(thisWeek[4].future).toBe(true);
    expect(grid[0][0].day).toBe("2026-09-14");
  });
});

describe("working offline", () => {
  const origin = "https://streaks.example";
  const get = (path: string, mode?: string) => ({ url: `${origin}${path}`, method: "GET", mode });

  it("tries the network first for pages, so updates show up", () => {
    expect(strategyFor(get("/", "navigate"), origin)).toBe("network-first");
    expect(strategyFor(get("/index.html"), origin)).toBe("network-first");
  });

  it("serves built files with a hash in the name from the cache: they never change", () => {
    expect(strategyFor(get("/assets/main-BYz3k9Qa.js"), origin)).toBe("cache-first");
    expect(strategyFor(get("/icon.svg"), origin)).toBe("cache-first");
  });

  it("leaves other sites and anything but GET alone", () => {
    expect(strategyFor({ url: "https://cdn.example/lib.js", method: "GET" }, origin)).toBe("network-only");
    expect(strategyFor({ url: `${origin}/api`, method: "POST" }, origin)).toBe("network-only");
  });

  it("clears out old versions of its own cache, and nobody else's", () => {
    expect(cachesToDelete(["streaks-v0", VERSION, "other-app", "streaks-old"])).toEqual(["streaks-v0", "streaks-old"]);
  });

  it("caches everything the app needs to open with no signal", () => {
    expect(APP_SHELL).toEqual(expect.arrayContaining(["./", "./index.html", "./manifest.webmanifest"]));
  });
});
