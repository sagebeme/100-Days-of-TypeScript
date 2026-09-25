import { readFile, writeFile } from "node:fs/promises";
import { dueReminders, nextReminderAt, type Fixture } from "./schedule.ts";
import { reminderEmail, type EmailSender } from "./email.ts";

// Which reminders have gone out, saved to a file so a restart never sends one twice.
export async function loadSent(path: string): Promise<Set<string>> {
  try {
    const data: unknown = JSON.parse(await readFile(path, "utf8"));
    return new Set(Array.isArray(data) ? data.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

export async function saveSent(path: string, sent: ReadonlySet<string>): Promise<void> {
  await writeFile(path, JSON.stringify([...sent], null, 2));
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
  const sent = await loadSent(options.sentPath);
  let count = 0;
  for (const reminder of dueReminders(options.fixtures, sent, options.now())) {
    try {
      await options.sender.send(reminderEmail(reminder, options.to));
      sent.add(reminder.id);
      await saveSent(options.sentPath, sent); // save after each one, in case the next one crashes
      count++;
      options.log(`Sent ${reminder.id}`);
    } catch (error) {
      // One failed email shouldn't stop the others. It isn't marked as sent, so it's tried again next time.
      options.log(`Couldn't send ${reminder.id}: ${error instanceof Error ? error.message : error}`);
    }
  }
  return count;
}

// Timers can't wait longer than about 24.8 days, so long waits are done in steps.
export const MAX_WAIT_MS = 2 ** 31 - 1;

export interface Timers {
  setTimeout(callback: () => void, ms: number): unknown;
}

// Runs forever: send what's due, then sleep until the next reminder. Returns a function that stops it.
export function runForever(options: RunOptions, timers: Timers = globalThis): () => void {
  let stopped = false;

  async function tick(): Promise<void> {
    if (stopped) return;
    await sendDue(options);
    const next = nextReminderAt(options.fixtures, await loadSent(options.sentPath), options.now());
    if (next === null) {
      options.log("No more reminders to send.");
      return;
    }
    const wait = Math.min(Math.max(next.getTime() - options.now().getTime(), 0), MAX_WAIT_MS);
    options.log(`Next reminder at ${next.toISOString()}`);
    timers.setTimeout(() => void tick(), wait);
  }

  void tick();
  return () => {
    stopped = true;
  };
}
