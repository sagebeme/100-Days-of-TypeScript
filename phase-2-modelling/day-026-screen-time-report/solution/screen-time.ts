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
  return sessions.reduce((sum, session) => sum + session.minutes, 0);
}

export function longSessionApps(sessions: Session[], threshold: number): string[] {
  return sessions.filter((session) => session.minutes >= threshold).map((session) => session.app);
}

export function minutesByCategory(sessions: Session[]): CategoryTotals {
  const start: CategoryTotals = { social: 0, games: 0, study: 0, video: 0 };
  return sessions.reduce((totals, session) => {
    totals[session.category] += session.minutes;
    return totals;
  }, start);
}

export function topApps(sessions: Session[], count: number): AppTotal[] {
  const perApp = sessions.reduce((totals, session) => {
    totals.set(session.app, (totals.get(session.app) ?? 0) + session.minutes);
    return totals;
  }, new Map<string, number>());

  return [...perApp.entries()]
    .map(([app, minutes]) => ({ app, minutes }))
    .sort((a, b) => b.minutes - a.minutes || a.app.localeCompare(b.app))
    .slice(0, count);
}

export function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}
