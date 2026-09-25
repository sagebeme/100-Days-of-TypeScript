import { z } from "zod";

export const FixtureSchema = z.object({
  id: z.string().min(1),
  competition: z.string().min(1),
  home: z.string().min(1),
  away: z.string().min(1),
  kickoff: z.iso.datetime({ offset: true }), // "2026-10-04T16:30:00Z": always with a time zone
});

export type Fixture = z.infer<typeof FixtureSchema>;

export type ReminderKind = "eve" | "soon";

export interface Reminder {
  id: string; // "<fixture id>:<kind>", so each reminder is only ever sent once
  kind: ReminderKind;
  fixture: Fixture;
  at: Date;
}

const HOUR = 60 * 60 * 1000;
// Kenya is always UTC+3: no summer time, so a fixed offset is safe here.
const NAIROBI_OFFSET = 3 * HOUR;

// 18:00 Nairobi time on the day before kickoff (as Nairobi counts days).
export function eveOf(kickoff: Date): Date {
  const nairobi = new Date(kickoff.getTime() + NAIROBI_OFFSET);
  const eveAt18Nairobi = Date.UTC(nairobi.getUTCFullYear(), nairobi.getUTCMonth(), nairobi.getUTCDate() - 1, 18);
  return new Date(eveAt18Nairobi - NAIROBI_OFFSET);
}

export function remindersFor(fixture: Fixture): Reminder[] {
  const kickoff = new Date(fixture.kickoff);
  return [
    { id: `${fixture.id}:eve`, kind: "eve", fixture, at: eveOf(kickoff) },
    { id: `${fixture.id}:soon`, kind: "soon", fixture, at: new Date(kickoff.getTime() - 2 * HOUR) },
  ];
}

export function followed(fixtures: Fixture[], team: string): Fixture[] {
  const wanted = team.trim().toLowerCase();
  return fixtures.filter((f) => f.home.toLowerCase() === wanted || f.away.toLowerCase() === wanted);
}

// Reminders whose time has come, that haven't been sent, for games that haven't kicked off yet.
export function dueReminders(fixtures: Fixture[], sent: ReadonlySet<string>, now: Date): Reminder[] {
  return fixtures
    .flatMap(remindersFor)
    .filter((r) => r.at <= now && !sent.has(r.id) && new Date(r.fixture.kickoff) > now)
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}

// When to wake up next, or null if there's nothing left to remind anyone about.
export function nextReminderAt(fixtures: Fixture[], sent: ReadonlySet<string>, now: Date): Date | null {
  const upcoming = fixtures
    .flatMap(remindersFor)
    .filter((r) => r.at > now && !sent.has(r.id))
    .map((r) => r.at.getTime());
  return upcoming.length > 0 ? new Date(Math.min(...upcoming)) : null;
}

const nairobiTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Nairobi",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatKickoff(kickoff: string): string {
  return `${nairobiTime.format(new Date(kickoff))} Nairobi time`;
}
