import { describe, it, expect } from "vitest";
import { DEFAULT_SETTINGS, formatLeft, inSchedule, isBlocked, isFocusing, parseBlocklist, toRules, type Session } from "./starter/rules.ts";

describe("reading the blocklist people type", () => {
  it("tidies addresses into plain domains, sorted, without repeats", () => {
    expect(parseBlocklist("https://www.YouTube.com/watch?v=x\ntiktok.com\n  x.com, youtube.com\n*.reddit.com/r/kenya")).toEqual({
      domains: ["reddit.com", "tiktok.com", "x.com", "youtube.com"],
      problems: [],
    });
  });

  it("keeps subdomains people chose on purpose, and drops ports", () => {
    expect(parseBlocklist("news.ycombinator.com\nlocalhost.example:8080").domains).toEqual(["localhost.example", "news.ycombinator.com"]);
  });

  it("reports what isn't a website instead of quietly keeping it", () => {
    const { domains, problems } = parseBlocklist("youtube\nfacebook.com\n-bad-.com");
    expect(domains).toEqual(["facebook.com"]);
    expect(problems).toEqual([`"youtube" isn't a website`, `"-bad-.com" isn't a website`]);
  });

  it("treats an empty box as an empty list", () => {
    expect(parseBlocklist("  \n\n ")).toEqual({ domains: [], problems: [] });
  });
});

describe("which pages are blocked", () => {
  const list = ["youtube.com", "x.com"];

  it("blocks the site and its subdomains", () => {
    expect(isBlocked("https://youtube.com/", list)).toBe(true);
    expect(isBlocked("https://m.youtube.com/watch?v=1", list)).toBe(true);
    expect(isBlocked("http://WWW.X.COM/home", list)).toBe(true);
  });

  it("never blocks a different site that merely ends the same way", () => {
    expect(isBlocked("https://notyoutube.com/", list)).toBe(false);
    expect(isBlocked("https://box.com/", list)).toBe(false);
  });

  it("leaves the browser's own pages and nonsense alone", () => {
    expect(isBlocked("chrome://extensions", list)).toBe(false);
    expect(isBlocked("not a url", list)).toBe(false);
    expect(isBlocked("https://youtube.com.evil.example/", list)).toBe(false);
  });
});

describe("the schedule", () => {
  const weekdayMornings: Session[] = [{ days: [1, 2, 3, 4, 5], start: "09:00", end: "12:00" }];
  // Monday 5 October 2026. Nairobi is UTC+3 all year.
  const nairobi = (time: string, day = "05") => new Date(`2026-10-${day}T${time}:00+03:00`);

  it("is on inside a session, from the start up to (not including) the end", () => {
    expect(inSchedule(nairobi("09:00"), weekdayMornings, "Africa/Nairobi")).toBe(true);
    expect(inSchedule(nairobi("11:59"), weekdayMornings, "Africa/Nairobi")).toBe(true);
    expect(inSchedule(nairobi("12:00"), weekdayMornings, "Africa/Nairobi")).toBe(false);
    expect(inSchedule(nairobi("08:59"), weekdayMornings, "Africa/Nairobi")).toBe(false);
  });

  it("is off on days that aren't listed", () => {
    expect(inSchedule(nairobi("10:00", "04"), weekdayMornings, "Africa/Nairobi")).toBe(false); // Sunday
  });

  it("uses the person's time zone, not the computer's", () => {
    const moment = new Date("2026-10-05T07:30:00Z"); // 10:30 in Nairobi, 08:30 in London
    expect(inSchedule(moment, weekdayMornings, "Africa/Nairobi")).toBe(true);
    expect(inSchedule(moment, weekdayMornings, "Europe/London")).toBe(false);
  });

  it("runs a late-night session past midnight into the next day", () => {
    const fridayNights: Session[] = [{ days: [5], start: "22:00", end: "02:00" }];
    expect(inSchedule(nairobi("23:30", "09"), fridayNights, "Africa/Nairobi")).toBe(true); // Friday night
    expect(inSchedule(nairobi("01:30", "10"), fridayNights, "Africa/Nairobi")).toBe(true); // Saturday, small hours
    expect(inSchedule(nairobi("02:00", "10"), fridayNights, "Africa/Nairobi")).toBe(false);
    expect(inSchedule(nairobi("01:30", "09"), fridayNights, "Africa/Nairobi")).toBe(false); // Friday's small hours belong to Thursday
  });

  it("is focusing during a manual session or the schedule, whichever comes first", () => {
    const evening = nairobi("19:00");
    const settings = { ...DEFAULT_SETTINGS, timeZone: "Africa/Nairobi" };
    expect(isFocusing(evening, settings)).toBe(false);
    expect(isFocusing(evening, { ...settings, focusUntil: evening.getTime() + 60_000 })).toBe(true);
    expect(isFocusing(evening, { ...settings, focusUntil: evening.getTime() })).toBe(false);
    expect(isFocusing(nairobi("10:00"), settings)).toBe(true);
  });
});

describe("Chrome's blocking rules", () => {
  it("makes one numbered rule per site, redirecting whole pages to the blocked page", () => {
    expect(toRules(["tiktok.com", "x.com"])).toEqual([
      {
        id: 1,
        priority: 1,
        action: { type: "redirect", redirect: { extensionPath: "/blocked.html?site=tiktok.com" } },
        condition: { requestDomains: ["tiktok.com"], resourceTypes: ["main_frame"] },
      },
      {
        id: 2,
        priority: 1,
        action: { type: "redirect", redirect: { extensionPath: "/blocked.html?site=x.com" } },
        condition: { requestDomains: ["x.com"], resourceTypes: ["main_frame"] },
      },
    ]);
  });

  it("makes no rules for an empty list", () => {
    expect(toRules([])).toEqual([]);
  });
});

describe("time left", () => {
  it("rounds up to whole minutes, and shows hours when there are some", () => {
    expect(formatLeft(18 * 60_000)).toBe("18 min");
    expect(formatLeft(60_001)).toBe("2 min");
    expect(formatLeft(65 * 60_000)).toBe("1 h 05 min");
    expect(formatLeft(-5)).toBe("0 min");
  });
});
