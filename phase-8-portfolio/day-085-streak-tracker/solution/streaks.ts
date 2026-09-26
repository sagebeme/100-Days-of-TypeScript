// Streaks, counted in the days of the person using it: a check-in at 11pm in Nairobi is that day,
// even though it's already tomorrow in UTC. Days are "YYYY-MM-DD" strings, which sort and compare simply.
export type Day = string;

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  checkins: Day[]; // sorted, no repeats
  createdOn: Day;
}

// The calendar day a moment falls on, in a time zone.
export function localDay(moment: Date, timeZone: string): Day {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(moment);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// Days are counted on the calendar, not in hours: adding a day across a clock change is still one day.
export function addDays(day: Day, n: number): Day {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(from: Day, to: Day): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
}

// Check in, or undo a check-in: the list stays sorted with no repeats. Can't check in to the future.
export function toggle(habit: Habit, day: Day, today: Day): Habit {
  if (day > today) throw new Error("You can't check in to a day that hasn't happened yet");
  const has = habit.checkins.includes(day);
  const checkins = has ? habit.checkins.filter((d) => d !== day) : [...habit.checkins, day].sort();
  return { ...habit, checkins };
}

// The run of days in a row ending today, or ending yesterday: until today is over, not having
// checked in yet doesn't break yesterday's streak.
export function currentStreak(checkins: Day[], today: Day): number {
  const days = new Set(checkins);
  let day = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

export function longestStreak(checkins: Day[]): number {
  const sorted = [...new Set(checkins)].sort();
  let best = 0;
  let run = 0;
  sorted.forEach((day, i) => {
    run = i > 0 && daysBetween(sorted[i - 1], day) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

// The share of days checked in, out of the last `days` days (counting today), or since the habit
// began if that's more recent. 0 to 1.
export function completionRate(habit: Habit, today: Day, days = 30): number {
  const start = [addDays(today, -(days - 1)), habit.createdOn].sort().at(-1)!;
  const span = daysBetween(start, today) + 1;
  if (span <= 0) return 0;
  const done = habit.checkins.filter((d) => d >= start && d <= today).length;
  return done / span;
}

export interface GridDay {
  day: Day;
  done: boolean;
  future: boolean;
}

// The last `weeks` weeks as columns of 7 days, Monday first, ending with the week that holds today.
export function weekGrid(checkins: Day[], today: Day, weeks = 12): GridDay[][] {
  const done = new Set(checkins);
  const weekday = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7; // Monday 0 … Sunday 6
  const firstMonday = addDays(today, -weekday - (weeks - 1) * 7);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = addDays(firstMonday, w * 7 + d);
      return { day, done: done.has(day), future: day > today };
    }),
  );
}

// A habit's milestone message, for the streak that was just reached.
export function milestone(streak: number): string | null {
  const marks: Record<number, string> = { 3: "3 days! A habit is starting.", 7: "A whole week!", 30: "30 days. That's a habit now.", 100: "100 days. Legendary." };
  return marks[streak] ?? null;
}
