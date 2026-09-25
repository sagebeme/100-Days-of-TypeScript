import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  eveOf,
  remindersFor,
  followed,
  dueReminders,
  nextReminderAt,
  formatKickoff,
  type Fixture,
} from "./starter/schedule.ts";
import { escapeHtml, reminderEmail, resendSender, consoleSender, type Email, type EmailSender } from "./starter/email.ts";
import { loadSent, saveSent, sendDue, runForever, MAX_WAIT_MS, type RunOptions } from "./starter/runner.ts";

const derby: Fixture = {
  id: "fkf-gor-afc",
  competition: "FKF Premier League",
  home: "Gor Mahia",
  away: "AFC Leopards",
  kickoff: "2026-10-04T12:00:00Z", // 15:00 in Nairobi
};
const northLondon: Fixture = {
  id: "epl-ars-tot",
  competition: "Premier League",
  home: "Arsenal",
  away: "Tottenham",
  kickoff: "2026-10-10T16:30:00Z", // 19:30 in Nairobi
};
const fixtures = [northLondon, derby];
const at = (iso: string) => new Date(iso);

describe("eveOf", () => {
  it("is 18:00 Nairobi time the day before", () => {
    expect(eveOf(at("2026-10-04T12:00:00Z")).toISOString()).toBe("2026-10-03T15:00:00.000Z");
  });

  it("goes by Nairobi's date, not London's", () => {
    // 22:30 UTC on the 4th is already 01:30 on the 5th in Nairobi, so the eve is the 4th.
    expect(eveOf(at("2026-10-04T22:30:00Z")).toISOString()).toBe("2026-10-04T15:00:00.000Z");
  });

  it("crosses month ends", () => {
    expect(eveOf(at("2026-11-01T12:00:00Z")).toISOString()).toBe("2026-10-31T15:00:00.000Z");
  });
});

describe("remindersFor", () => {
  it("makes an eve reminder and a two-hours-before reminder", () => {
    expect(remindersFor(derby)).toEqual([
      { id: "fkf-gor-afc:eve", kind: "eve", fixture: derby, at: at("2026-10-03T15:00:00Z") },
      { id: "fkf-gor-afc:soon", kind: "soon", fixture: derby, at: at("2026-10-04T10:00:00Z") },
    ]);
  });
});

describe("followed", () => {
  it("finds a team's games, home or away, whatever the case", () => {
    expect(followed(fixtures, "arsenal")).toEqual([northLondon]);
    expect(followed(fixtures, "  AFC Leopards ")).toEqual([derby]);
    expect(followed(fixtures, "Tusker")).toEqual([]);
  });
});

describe("dueReminders", () => {
  it("is empty before anything is due", () => {
    expect(dueReminders(fixtures, new Set(), at("2026-10-01T00:00:00Z"))).toEqual([]);
  });

  it("returns what's due, earliest first", () => {
    const due = dueReminders(fixtures, new Set(), at("2026-10-04T10:30:00Z"));
    expect(due.map((r) => r.id)).toEqual(["fkf-gor-afc:eve", "fkf-gor-afc:soon"]);
  });

  it("skips reminders already sent", () => {
    const due = dueReminders(fixtures, new Set(["fkf-gor-afc:eve"]), at("2026-10-04T10:30:00Z"));
    expect(due.map((r) => r.id)).toEqual(["fkf-gor-afc:soon"]);
  });

  it("never reminds you about a game that has started", () => {
    expect(dueReminders(fixtures, new Set(), at("2026-10-04T12:00:00Z")).map((r) => r.id)).toEqual([]);
  });
});

describe("nextReminderAt", () => {
  it("finds the next reminder still to come", () => {
    expect(nextReminderAt(fixtures, new Set(), at("2026-10-01T00:00:00Z"))).toEqual(at("2026-10-03T15:00:00Z"));
    expect(nextReminderAt(fixtures, new Set(), at("2026-10-03T15:00:00Z"))).toEqual(at("2026-10-04T10:00:00Z"));
  });

  it("skips sent ones, and says when there's nothing left", () => {
    const sent = new Set(["epl-ars-tot:eve", "epl-ars-tot:soon"]);
    expect(nextReminderAt(fixtures, sent, at("2026-10-05T00:00:00Z"))).toBeNull();
  });
});

describe("formatKickoff", () => {
  it("shows the time in Nairobi", () => {
    expect(formatKickoff("2026-10-10T16:30:00Z")).toBe("Sat 10 Oct, 19:30 Nairobi time");
    expect(formatKickoff("2026-10-04T21:00:00Z")).toBe("Mon 5 Oct, 00:00 Nairobi time");
  });
});

describe("reminderEmail", () => {
  it("writes the eve email", () => {
    const [eve] = remindersFor(northLondon);
    const email = reminderEmail(eve, "fan@example.com");
    expect(email.to).toBe("fan@example.com");
    expect(email.subject).toBe("Tomorrow: Arsenal vs Tottenham");
    expect(email.text).toBe("Match day is tomorrow.\n\nArsenal vs Tottenham\nPremier League\nSat 10 Oct, 19:30 Nairobi time");
  });

  it("writes the two-hours email", () => {
    const [, soon] = remindersFor(derby);
    expect(reminderEmail(soon, "fan@example.com").subject).toBe("Kick-off in 2 hours: Gor Mahia vs AFC Leopards");
  });

  it("never lets a team name become HTML", () => {
    const sneaky = { ...derby, home: "<script>alert(1)</script>" };
    const html = reminderEmail(remindersFor(sneaky)[0], "fan@example.com").html;
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes the five special characters", () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;");
  });
});

describe("resendSender", () => {
  const email: Email = { to: "fan@example.com", subject: "Hi", text: "Hello", html: "<p>Hello</p>" };

  it("POSTs the email with the key in a header", async () => {
    const fetchFn = vi.fn(async () => new Response(JSON.stringify({ id: "abc" }), { status: 200 }));
    await resendSender("re_test_key", "Reminders <onboarding@resend.dev>", fetchFn).send(email);
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer re_test_key");
    expect(JSON.parse(String(init.body))).toEqual({
      from: "Reminders <onboarding@resend.dev>",
      to: ["fan@example.com"],
      subject: "Hi",
      text: "Hello",
      html: "<p>Hello</p>",
    });
  });

  it("throws with the service's explanation", async () => {
    const fetchFn = vi.fn(async () => new Response("The from address is not verified", { status: 403 }));
    await expect(resendSender("re_test_key", "a@b.co", fetchFn).send(email)).rejects.toThrow(
      "Email failed (403): The from address is not verified",
    );
  });
});

describe("consoleSender", () => {
  it("prints instead of sending", async () => {
    const lines: string[] = [];
    await consoleSender((line) => lines.push(line)).send({ to: "a@b.co", subject: "Hi", text: "Hello", html: "" });
    expect(lines).toEqual(["To: a@b.co\nSubject: Hi\n\nHello\n"]);
  });
});

describe("the runner", () => {
  let dir: string;
  let sentPath: string;
  let outbox: Email[];
  let logs: string[];
  let now: Date;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "reminders-"));
    sentPath = join(dir, "sent.json");
    outbox = [];
    logs = [];
    now = at("2026-10-04T10:30:00Z");
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const recorder: EmailSender = { send: async (email) => void outbox.push(email) };
  const options = (sender: EmailSender = recorder): RunOptions => ({
    fixtures,
    to: "fan@example.com",
    sender,
    sentPath,
    now: () => now,
    log: (line) => logs.push(line),
  });

  it("remembers what it sent, even across restarts", async () => {
    await saveSent(sentPath, new Set(["a", "b"]));
    expect(JSON.parse(await readFile(sentPath, "utf8"))).toEqual(["a", "b"]);
    expect(await loadSent(sentPath)).toEqual(new Set(["a", "b"]));
  });

  it("starts fresh when the file is missing or broken", async () => {
    expect(await loadSent(sentPath)).toEqual(new Set());
    await writeFile(sentPath, "{oops");
    expect(await loadSent(sentPath)).toEqual(new Set());
  });

  it("sends what's due, once", async () => {
    expect(await sendDue(options())).toBe(2);
    expect(outbox.map((e) => e.subject)).toEqual([
      "Tomorrow: Gor Mahia vs AFC Leopards",
      "Kick-off in 2 hours: Gor Mahia vs AFC Leopards",
    ]);
    expect(await sendDue(options())).toBe(0);
    expect(outbox).toHaveLength(2);
    expect(logs).toEqual(["Sent fkf-gor-afc:eve", "Sent fkf-gor-afc:soon"]);
  });

  it("keeps going when one email fails, and tries it again next time", async () => {
    let calls = 0;
    const flaky: EmailSender = {
      send: async (email) => {
        if (calls++ === 0) throw new Error("mail server busy");
        outbox.push(email);
      },
    };
    expect(await sendDue(options(flaky))).toBe(1);
    expect(logs[0]).toBe("Couldn't send fkf-gor-afc:eve: mail server busy");
    expect(await sendDue(options(flaky))).toBe(1);
    expect(outbox.map((e) => e.subject)).toEqual([
      "Kick-off in 2 hours: Gor Mahia vs AFC Leopards",
      "Tomorrow: Gor Mahia vs AFC Leopards",
    ]);
  });

  it("sleeps until the next reminder, then sends it", async () => {
    now = at("2026-10-03T12:00:00Z");
    const waits: { run: () => void; ms: number }[] = [];
    const stop = runForever(options(), { setTimeout: (run, ms) => waits.push({ run, ms }) });

    await vi.waitFor(() => expect(waits).toHaveLength(1));
    expect(waits[0].ms).toBe(3 * 60 * 60 * 1000); // until 15:00 UTC, the derby's eve
    expect(outbox).toEqual([]);

    now = at("2026-10-03T15:00:00Z");
    waits[0].run();
    await vi.waitFor(() => expect(outbox.map((e) => e.subject)).toEqual(["Tomorrow: Gor Mahia vs AFC Leopards"]));
    await vi.waitFor(() => expect(waits).toHaveLength(2));
    expect(waits[1].ms).toBe(19 * 60 * 60 * 1000); // until 10:00 UTC the next day
    stop();
  });

  it("never asks a timer to wait longer than it can", async () => {
    now = at("2025-01-01T00:00:00Z"); // months before the first reminder
    const waits: number[] = [];
    runForever(options(), { setTimeout: (_run, ms) => waits.push(ms) });
    await vi.waitFor(() => expect(waits).toEqual([MAX_WAIT_MS]));
  });

  it("stops when every reminder has gone out", async () => {
    now = at("2026-10-20T00:00:00Z");
    const waits: number[] = [];
    runForever(options(), { setTimeout: (_run, ms) => waits.push(ms) });
    await vi.waitFor(() => expect(logs).toContain("No more reminders to send."));
    expect(waits).toEqual([]);
  });
});
