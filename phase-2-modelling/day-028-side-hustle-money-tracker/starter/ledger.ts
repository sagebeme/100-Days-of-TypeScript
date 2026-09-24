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
  // TODO: an object with: whole-number id, kind "income" or "expense", positive finite amount, string label, string date
  throw new Error("not implemented yet");
}

export function isLedger(value: unknown): value is Ledger {
  // TODO: an object whose `entries` is an array where every item passes isEntry
  throw new Error("not implemented yet");
}

export function addEntry(ledger: Ledger, input: NewEntry): Ledger {
  // TODO: throw new Error("Amount must be a positive number") unless input.amount is finite and > 0
  // TODO: return a NEW ledger with the entry added; its id is the old entry count + 1
  throw new Error("not implemented yet");
}

export function summarize(ledger: Ledger): Summary {
  // TODO: income = sum of income amounts, expenses = sum of expense amounts, balance = income - expenses
  throw new Error("not implemented yet");
}

export async function saveLedger(path: string, ledger: Ledger): Promise<void> {
  // TODO: write JSON.stringify(ledger, null, 2) to path
  throw new Error("not implemented yet");
}

export async function loadLedger(path: string): Promise<Ledger> {
  // TODO: read the file; if it doesn't exist (error.code === "ENOENT") return { entries: [] }; re-throw other errors
  // TODO: JSON.parse the text (let a SyntaxError through)
  // TODO: if the result isn't a valid ledger (isLedger), throw new Error("Ledger file is corrupted")
  throw new Error("not implemented yet");
}
