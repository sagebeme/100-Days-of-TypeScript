import { readFile, writeFile } from "node:fs/promises";

export type EntryKind = "income" | "expense";

export interface Entry {
  id: number;
  kind: EntryKind;
  amount: number;
  label: string;
  date: string;
}

export interface NewEntry {
  kind: EntryKind;
  amount: number;
  label: string;
  date: string;
}

export interface Ledger {
  entries: Entry[];
}

export interface Summary {
  income: number;
  expenses: number;
  balance: number;
}

export function isEntry(value: unknown): value is Entry {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "number" &&
    Number.isInteger(candidate.id) &&
    (candidate.kind === "income" || candidate.kind === "expense") &&
    typeof candidate.amount === "number" &&
    Number.isFinite(candidate.amount) &&
    candidate.amount > 0 &&
    typeof candidate.label === "string" &&
    typeof candidate.date === "string"
  );
}

export function isLedger(value: unknown): value is Ledger {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const entries = (value as Record<string, unknown>).entries;
  return Array.isArray(entries) && entries.every(isEntry);
}

export function addEntry(ledger: Ledger, input: NewEntry): Ledger {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Amount must be a positive number");
  }
  const entry: Entry = { id: ledger.entries.length + 1, ...input };
  return { entries: [...ledger.entries, entry] };
}

export function summarize(ledger: Ledger): Summary {
  let income = 0;
  let expenses = 0;
  for (const entry of ledger.entries) {
    if (entry.kind === "income") {
      income += entry.amount;
    } else {
      expenses += entry.amount;
    }
  }
  return { income, expenses, balance: income - expenses };
}

export async function saveLedger(path: string, ledger: Ledger): Promise<void> {
  await writeFile(path, JSON.stringify(ledger, null, 2));
}

export async function loadLedger(path: string): Promise<Ledger> {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { entries: [] };
    }
    throw error;
  }

  const data: unknown = JSON.parse(text);
  if (!isLedger(data)) {
    throw new Error("Ledger file is corrupted");
  }
  return data;
}
