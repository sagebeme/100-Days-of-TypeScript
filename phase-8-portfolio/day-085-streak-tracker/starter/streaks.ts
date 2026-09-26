// Streaks, counted in the days of the person using it. Days are "YYYY-MM-DD". The tests are the spec.
export type Day = string;

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  checkins: Day[]; // sorted, no repeats
  createdOn: Day;
}

export interface GridDay {
  day: Day;
  done: boolean;
  future: boolean;
}

export function localDay(moment: Date, timeZone: string): Day {
  throw new Error(`TODO: localDay(${moment.toISOString()}, ${timeZone})`);
}

export function addDays(day: Day, n: number): Day {
  throw new Error(`TODO: addDays(${day}, ${n})`);
}

export function daysBetween(from: Day, to: Day): number {
  throw new Error(`TODO: daysBetween(${from}, ${to})`);
}

export function toggle(habit: Habit, day: Day, today: Day): Habit {
  throw new Error(`TODO: toggle(${habit.name}, ${day}, ${today})`);
}

export function currentStreak(checkins: Day[], today: Day): number {
  throw new Error(`TODO: currentStreak(${checkins.length}, ${today})`);
}

export function longestStreak(checkins: Day[]): number {
  throw new Error(`TODO: longestStreak(${checkins.length})`);
}

export function completionRate(habit: Habit, today: Day, days = 30): number {
  throw new Error(`TODO: completionRate(${habit.name}, ${today}, ${days})`);
}

export function weekGrid(checkins: Day[], today: Day, weeks = 12): GridDay[][] {
  throw new Error(`TODO: weekGrid(${checkins.length}, ${today}, ${weeks})`);
}

export function milestone(streak: number): string | null {
  throw new Error(`TODO: milestone(${streak})`);
}
