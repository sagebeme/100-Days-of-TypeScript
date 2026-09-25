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
  // TODO: 18:00 Nairobi time on the day before kickoff, where "the day" is the date in Nairobi.
  //   Shift kickoff by NAIROBI_OFFSET to read Nairobi's date with getUTCFullYear/Month/Date,
  //   build 18:00 of the day before with Date.UTC, then shift back by NAIROBI_OFFSET.
  throw new Error("not implemented yet");
}

export function remindersFor(fixture: Fixture): Reminder[] {
  // TODO: two reminders: "eve" at eveOf(kickoff), and "soon" 2 hours before kickoff.
  //   Their ids are "<fixture id>:eve" and "<fixture id>:soon".
  throw new Error("not implemented yet");
}

export function followed(fixtures: Fixture[], team: string): Fixture[] {
  // TODO: the fixtures where the team plays, home or away (ignore case and spaces around the name)
  throw new Error("not implemented yet");
}

export function dueReminders(fixtures: Fixture[], sent: ReadonlySet<string>, now: Date): Reminder[] {
  // TODO: every reminder whose time has come (at <= now), that isn't in `sent`,
  //   for a game that hasn't kicked off yet. Earliest first.
  throw new Error("not implemented yet");
}

export function nextReminderAt(fixtures: Fixture[], sent: ReadonlySet<string>, now: Date): Date | null {
  // TODO: the time of the earliest reminder still in the future and not sent, or null if there isn't one
  throw new Error("not implemented yet");
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
