import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  isEntry,
  isLedger,
  addEntry,
  summarize,
  saveLedger,
  loadLedger,
  type Ledger,
} from "./starter/ledger.ts";
import { runCommand } from "./starter/commands.ts";

let dir: string;
let file: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "money-"));
  file = join(dir, "money.json");
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const sample: Ledger = {
  entries: [
    { id: 1, kind: "income", amount: 5000, label: "Logo design", date: "2026-09-20" },
    { id: 2, kind: "expense", amount: 300, label: "Data bundle", date: "2026-09-21" },
  ],
};

describe("type guards", () => {
  it("accepts a valid entry and ledger", () => {
    expect(isEntry(sample.entries[0])).toBe(true);
    expect(isLedger(sample)).toBe(true);
    expect(isLedger({ entries: [] })).toBe(true);
  });

  it.each([
    ["null", null],
    ["a wrong kind", { id: 1, kind: "gift", amount: 5, label: "x", date: "d" }],
    ["a zero amount", { id: 1, kind: "income", amount: 0, label: "x", date: "d" }],
    ["a NaN amount", { id: 1, kind: "income", amount: NaN, label: "x", date: "d" }],
    ["a fractional id", { id: 1.5, kind: "income", amount: 5, label: "x", date: "d" }],
    ["a missing label", { id: 1, kind: "income", amount: 5, date: "d" }],
  ])("rejects an entry with %s", (_label, value) => {
    expect(isEntry(value)).toBe(false);
  });

  it("rejects things that are not ledgers", () => {
    expect(isLedger(null)).toBe(false);
    expect(isLedger({})).toBe(false);
    expect(isLedger({ entries: "nope" })).toBe(false);
    expect(isLedger({ entries: [{ nonsense: true }] })).toBe(false);
  });
});

describe("addEntry", () => {
  it("returns a new ledger with the entry added and the next id", () => {
    const updated = addEntry(sample, { kind: "income", amount: 800, label: "Sticker pack", date: "2026-09-22" });
    expect(updated.entries).toHaveLength(3);
    expect(updated.entries[2]).toEqual({ id: 3, kind: "income", amount: 800, label: "Sticker pack", date: "2026-09-22" });
  });

  it("does not change the ledger it was given", () => {
    addEntry(sample, { kind: "income", amount: 800, label: "x", date: "d" });
    expect(sample.entries).toHaveLength(2);
  });

  it.each([0, -5, NaN, Infinity])("rejects an amount of %s", (amount) => {
    expect(() => addEntry({ entries: [] }, { kind: "income", amount, label: "x", date: "d" })).toThrow(
      "Amount must be a positive number",
    );
  });
});

describe("summarize", () => {
  it("totals income, expenses and balance", () => {
    expect(summarize(sample)).toEqual({ income: 5000, expenses: 300, balance: 4700 });
  });

  it("is all zeros for an empty ledger", () => {
    expect(summarize({ entries: [] })).toEqual({ income: 0, expenses: 0, balance: 0 });
  });

  it("can go negative", () => {
    const overspent: Ledger = { entries: [{ id: 1, kind: "expense", amount: 100, label: "x", date: "d" }] };
    expect(summarize(overspent).balance).toBe(-100);
  });
});

describe("saveLedger and loadLedger", () => {
  it("round-trips a ledger through a file", async () => {
    await saveLedger(file, sample);
    await expect(loadLedger(file)).resolves.toEqual(sample);
  });

  it("writes readable, indented JSON", async () => {
    await saveLedger(file, sample);
    const text = await readFile(file, "utf8");
    expect(text).toContain('\n  "entries"');
  });

  it("gives an empty ledger when the file doesn't exist yet", async () => {
    await expect(loadLedger(file)).resolves.toEqual({ entries: [] });
  });

  it("lets a JSON syntax error through", async () => {
    await writeFile(file, "{ not json");
    await expect(loadLedger(file)).rejects.toThrow(SyntaxError);
  });

  it("refuses a file that is valid JSON but not a ledger", async () => {
    await writeFile(file, JSON.stringify({ entries: [{ oops: 1 }] }));
    await expect(loadLedger(file)).rejects.toThrow("Ledger file is corrupted");
  });

  it("does not swallow other file errors (a directory is not a file)", async () => {
    await expect(loadLedger(dir)).rejects.toThrow(/EISDIR/);
  });
});

describe("runCommand", () => {
  it("adds entries and reports them", async () => {
    await expect(runCommand(["add", "income", "5000", "Logo", "design"], file, "2026-09-24")).resolves.toBe(
      "Added income KES 5000: Logo design",
    );
    await expect(runCommand(["add", "expense", "300", "Data bundle"], file, "2026-09-24")).resolves.toBe(
      "Added expense KES 300: Data bundle",
    );
  });

  it("saves to the file so a later run sees it", async () => {
    await runCommand(["add", "income", "5000", "Logo design"], file, "2026-09-24");
    await expect(runCommand(["summary"], file)).resolves.toBe("Income: KES 5000\nExpenses: KES 0\nBalance: KES 5000");
  });

  it("summarises income, expenses and balance", async () => {
    await saveLedger(file, sample);
    await expect(runCommand(["summary"], file)).resolves.toBe("Income: KES 5000\nExpenses: KES 300\nBalance: KES 4700");
  });

  it("lists entries, one per line", async () => {
    await saveLedger(file, sample);
    await expect(runCommand(["list"], file)).resolves.toBe(
      "#1 2026-09-20 income  KES 5000 Logo design\n#2 2026-09-21 expense KES 300 Data bundle",
    );
  });

  it("says so when there is nothing to list", async () => {
    await expect(runCommand(["list"], file)).resolves.toBe("No entries yet");
  });

  it("stamps new entries with the date it was given", async () => {
    await runCommand(["add", "income", "100", "Tip"], file, "2026-01-02");
    await expect(runCommand(["list"], file)).resolves.toBe("#1 2026-01-02 income  KES 100 Tip");
  });

  it("rejects bad add commands with a usage message", async () => {
    const usage = "Usage: add <income|expense> <amount> <label>";
    await expect(runCommand(["add"], file)).rejects.toThrow(usage);
    await expect(runCommand(["add", "gift", "100", "Tip"], file)).rejects.toThrow(usage);
    await expect(runCommand(["add", "income", "100"], file)).rejects.toThrow(usage);
  });

  it("rejects an amount that isn't a positive number, and saves nothing", async () => {
    await expect(runCommand(["add", "income", "lots", "Tip"], file)).rejects.toThrow("Amount must be a positive number");
    await expect(runCommand(["add", "income", "-5", "Tip"], file)).rejects.toThrow("Amount must be a positive number");
    await expect(loadLedger(file)).resolves.toEqual({ entries: [] });
  });

  it("rejects no command and unknown commands", async () => {
    await expect(runCommand([], file)).rejects.toThrow("Usage: add | list | summary");
    await expect(runCommand(["frobnicate"], file)).rejects.toThrow("Unknown command: frobnicate");
  });
});

describe("the real CLI, run as a separate process", () => {
  const cli = new URL("./starter/cli.ts", import.meta.url);

  const run = (args: string[]) =>
    spawnSync(process.execPath, [cli.pathname.replace(/^\/([A-Za-z]:)/, "$1"), ...args], {
      encoding: "utf8",
      env: { ...process.env, MONEY_FILE: file },
    });

  it("adds money, remembers it between runs, and prints the summary", () => {
    const added = run(["add", "income", "5000", "Logo design"]);
    expect(added.status).toBe(0);
    expect(added.stdout.trim()).toBe("Added income KES 5000: Logo design");

    expect(run(["add", "expense", "300", "Data bundle"]).status).toBe(0);

    const summary = run(["summary"]);
    expect(summary.status).toBe(0);
    expect(summary.stdout.trim()).toBe("Income: KES 5000\nExpenses: KES 300\nBalance: KES 4700");
  });

  it("prints a message and exits non-zero on a bad command", () => {
    const result = run(["frobnicate"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Unknown command: frobnicate");
  });
});
