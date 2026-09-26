// The rules of focus mode, with no browser in sight: which sites, when, and the rules Chrome enforces.

export interface Session {
  days: number[]; // 0 Sunday … 6 Saturday
  start: string; // "08:00"
  end: string; // "12:30"; an end before the start runs past midnight
}

export interface Settings {
  blocklist: string[]; // domains, as stored: "youtube.com"
  schedule: Session[];
  focusUntil: number | null; // a manual focus session: ms since 1970, or none
  timeZone: string;
}

// What people type, tidied into domains: "https://www.YouTube.com/watch?v=x" -> "youtube.com".
// Anything that isn't a domain is reported instead of being silently kept.
export function parseBlocklist(text: string): { domains: string[]; problems: string[] } {
  const domains = new Set<string>();
  const problems: string[] = [];
  for (const raw of text.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)) {
    let host = raw.toLowerCase().replace(/^\*\./, "");
    try {
      if (/^[a-z]+:\/\//.test(host)) host = new URL(host).hostname;
    } catch {
      problems.push(`"${raw}" isn't a website`);
      continue;
    }
    host = host.replace(/^www\./, "").split(/[/?#]/)[0].replace(/:\d+$/, "");
    if (!/^(?=.{3,253}$)([a-z0-9-]+\.)+[a-z]{2,}$/.test(host) || host.split(".").some((part) => part.startsWith("-") || part.endsWith("-"))) {
      problems.push(`"${raw}" isn't a website`);
      continue;
    }
    domains.add(host);
  }
  return { domains: [...domains].sort(), problems };
}

// Blocking youtube.com blocks m.youtube.com too, but never notyoutube.com.
export function isBlocked(url: string, blocklist: string[]): boolean {
  let host: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    host = parsed.hostname.toLowerCase();
  } catch {
    return false;
  }
  return blocklist.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// The day of the week and the minute of the day, where the person is.
function localTime(now: Date, timeZone: string): { day: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, minute: Number(get("hour")) * 60 + Number(get("minute")) };
}

export function inSchedule(now: Date, schedule: Session[], timeZone: string): boolean {
  const { day, minute } = localTime(now, timeZone);
  return schedule.some((s) => {
    const start = minutes(s.start);
    const end = minutes(s.end);
    if (start < end) return s.days.includes(day) && minute >= start && minute < end;
    // Past midnight: the evening part is on the listed day, the early-morning part on the next.
    return (s.days.includes(day) && minute >= start) || (s.days.includes((day + 6) % 7) && minute < end);
  });
}

export function isFocusing(now: Date, settings: Settings): boolean {
  return (settings.focusUntil !== null && now.getTime() < settings.focusUntil) || inSchedule(now, settings.schedule, settings.timeZone);
}

// What Chrome's declarativeNetRequest needs: one rule per domain, sending whole pages (not images or
// scripts) to the extension's own "blocked" page, with the site in the address so it can say which.
export interface DnrRule {
  id: number;
  priority: number;
  action: { type: "redirect"; redirect: { extensionPath: string } };
  condition: { requestDomains: string[]; resourceTypes: ["main_frame"] };
}

export function toRules(blocklist: string[]): DnrRule[] {
  return blocklist.map((domain, i) => ({
    id: i + 1,
    priority: 1,
    action: { type: "redirect", redirect: { extensionPath: `/blocked.html?site=${encodeURIComponent(domain)}` } },
    condition: { requestDomains: [domain], resourceTypes: ["main_frame"] },
  }));
}

// "18 min" or "1 h 05 min" left.
export function formatLeft(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 60_000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? `${h} h ${String(m).padStart(2, "0")} min` : `${m} min`;
}

export const DEFAULT_SETTINGS: Settings = {
  blocklist: ["instagram.com", "tiktok.com", "x.com", "youtube.com"],
  schedule: [{ days: [1, 2, 3, 4, 5], start: "09:00", end: "12:00" }],
  focusUntil: null,
  timeZone: "Africa/Nairobi",
};
