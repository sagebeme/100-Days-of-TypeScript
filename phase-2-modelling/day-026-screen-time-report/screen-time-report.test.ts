import { describe, it, expect } from "vitest";
import {
  totalMinutes,
  longSessionApps,
  minutesByCategory,
  topApps,
  formatMinutes,
  type Session,
} from "./starter/screen-time.ts";

const sessions: Session[] = [
  { app: "Instagram", category: "social", minutes: 95, day: "Mon" },
  { app: "TikTok", category: "social", minutes: 130, day: "Mon" },
  { app: "EA FC", category: "games", minutes: 60, day: "Tue" },
  { app: "Instagram", category: "social", minutes: 45, day: "Tue" },
  { app: "Notes", category: "study", minutes: 80, day: "Tue" },
  { app: "YouTube", category: "video", minutes: 25, day: "Wed" },
];

describe("totalMinutes", () => {
  it("adds up every session", () => {
    expect(totalMinutes(sessions)).toBe(435);
  });

  it("is 0 for no sessions", () => {
    expect(totalMinutes([])).toBe(0);
  });
});

describe("longSessionApps", () => {
  it("lists apps of sessions at or above the threshold, in order", () => {
    expect(longSessionApps(sessions, 90)).toEqual(["Instagram", "TikTok"]);
  });

  it("includes sessions that are exactly the threshold", () => {
    expect(longSessionApps(sessions, 60)).toEqual(["Instagram", "TikTok", "EA FC", "Notes"]);
  });

  it("is empty when nothing is long enough", () => {
    expect(longSessionApps(sessions, 500)).toEqual([]);
  });
});

describe("minutesByCategory", () => {
  it("adds up minutes per category", () => {
    expect(minutesByCategory(sessions)).toEqual({ social: 270, games: 60, study: 80, video: 25 });
  });

  it("always includes every category, even with no sessions", () => {
    expect(minutesByCategory([])).toEqual({ social: 0, games: 0, study: 0, video: 0 });
  });
});

describe("topApps", () => {
  it("adds up minutes per app and ranks them", () => {
    expect(topApps(sessions, 2)).toEqual([
      { app: "Instagram", minutes: 140 },
      { app: "TikTok", minutes: 130 },
    ]);
  });

  it("breaks ties by app name", () => {
    const tied: Session[] = [
      { app: "Zed", category: "study", minutes: 30, day: "Mon" },
      { app: "Alpha", category: "study", minutes: 30, day: "Mon" },
    ];
    expect(topApps(tied, 2).map((a) => a.app)).toEqual(["Alpha", "Zed"]);
  });

  it("returns everything when count is bigger than the number of apps", () => {
    expect(topApps(sessions, 99)).toHaveLength(5);
  });

  it("does not reorder the sessions it was given", () => {
    topApps(sessions, 2);
    expect(sessions[0].app).toBe("Instagram");
    expect(sessions[1].app).toBe("TikTok");
  });
});

describe("formatMinutes", () => {
  it.each([
    [0, "0m"],
    [45, "45m"],
    [59, "59m"],
    [60, "1h 00m"],
    [125, "2h 05m"],
    [435, "7h 15m"],
  ])("formats %i minutes as %s", (total, expected) => {
    expect(formatMinutes(total)).toBe(expected);
  });
});
