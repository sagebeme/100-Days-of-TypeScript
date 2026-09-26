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
  throw new Error(`TODO: parseBlocklist(${text.length} characters)`);
}

// Blocking youtube.com blocks m.youtube.com too, but never notyoutube.com.
export function isBlocked(url: string, blocklist: string[]): boolean {
  throw new Error(`TODO: isBlocked(${url}, ${blocklist.length} sites)`);
}

// Hint: Intl.DateTimeFormat(..., { timeZone }).formatToParts(now) gives the weekday, hour and minute
// where the person is, whatever time zone this computer is in.
export function inSchedule(now: Date, schedule: Session[], timeZone: string): boolean {
  throw new Error(`TODO: inSchedule(${now.toISOString()}, ${schedule.length} sessions, ${timeZone})`);
}

export function isFocusing(now: Date, settings: Settings): boolean {
  throw new Error(`TODO: isFocusing(${now.toISOString()}, ${settings.timeZone})`);
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
  throw new Error(`TODO: toRules(${blocklist.length} sites)`);
}

// "18 min" or "1 h 05 min" left.
export function formatLeft(ms: number): string {
  throw new Error(`TODO: formatLeft(${ms})`);
}

export const DEFAULT_SETTINGS: Settings = {
  blocklist: ["instagram.com", "tiktok.com", "x.com", "youtube.com"],
  schedule: [{ days: [1, 2, 3, 4, 5], start: "09:00", end: "12:00" }],
  focusUntil: null,
  timeZone: "Africa/Nairobi",
};
