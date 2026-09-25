import { readFile, writeFile } from "node:fs/promises";
import { dueReminders, nextReminderAt, type Fixture } from "./schedule.ts";
import { reminderEmail, type EmailSender } from "./email.ts";

// Which reminders have gone out, saved to a file so a restart never sends one twice.
export async function loadSent(path: string): Promise<Set<string>> {
  // TODO: read the JSON list of ids. A missing or broken file means nothing has been sent yet: an empty Set.
  throw new Error("not implemented yet");
}

export async function saveSent(path: string, sent: ReadonlySet<string>): Promise<void> {
  // TODO: write the ids as a pretty JSON list
  throw new Error("not implemented yet");
}

export interface RunOptions {
  fixtures: Fixture[];
  to: string;
  sender: EmailSender;
  sentPath: string;
  now: () => Date;
  log: (line: string) => void;
}

// Sends everything that's due now. Returns how many went out.
export async function sendDue(options: RunOptions): Promise<number> {
  // TODO: load what's been sent, then for each due reminder:
  //   send reminderEmail(reminder, options.to); add its id to the set; save straight away;
  //   log "Sent <id>". If sending throws, log "Couldn't send <id>: <message>" and carry on with the rest
  //   (a failed reminder isn't marked as sent, so it's tried again next time)
  throw new Error("not implemented yet");
}

// Timers can't wait longer than about 24.8 days, so long waits are done in steps.
export const MAX_WAIT_MS = 2 ** 31 - 1;

export interface Timers {
  setTimeout(callback: () => void, ms: number): unknown;
}

// Runs forever: send what's due, then sleep until the next reminder. Returns a function that stops it.
export function runForever(options: RunOptions, timers: Timers = globalThis): () => void {
  // TODO: an async tick(): stop if stopped; sendDue; find nextReminderAt (with the saved ids).
  //   None left -> log "No more reminders to send." and finish.
  //   Otherwise log `Next reminder at <ISO time>` and timers.setTimeout(tick, wait), where wait is the
  //   time until then, at least 0 and at most MAX_WAIT_MS
  // TODO: start with one tick, and return a function that sets stopped = true
  throw new Error("not implemented yet");
}
