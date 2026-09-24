export type Category = "social" | "games" | "study" | "video";

export interface Session {
  app: string;
  category: Category;
  minutes: number;
  day: string;
}

export type CategoryTotals = Record<Category, number>;

export interface AppTotal {
  app: string;
  minutes: number;
}

export function totalMinutes(sessions: Session[]): number {
  // TODO: reduce the sessions down to the sum of their minutes
  throw new Error("not implemented yet");
}

export function longSessionApps(sessions: Session[], threshold: number): string[] {
  // TODO: filter to sessions of at least `threshold` minutes, then map to the app name
  throw new Error("not implemented yet");
}

export function minutesByCategory(sessions: Session[]): CategoryTotals {
  // TODO: reduce into an object that starts as { social: 0, games: 0, study: 0, video: 0 }
  throw new Error("not implemented yet");
}

export function topApps(sessions: Session[], count: number): AppTotal[] {
  // TODO: add up minutes per app, sort highest first (ties: app name A to Z), keep the first `count`
  throw new Error("not implemented yet");
}

export function formatMinutes(total: number): string {
  // TODO: 0 -> "0m", 45 -> "45m", 60 -> "1h 00m", 125 -> "2h 05m"
  throw new Error("not implemented yet");
}
