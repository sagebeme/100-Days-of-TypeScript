import { parseArgs, type ParseArgsOptionsConfig } from "node:util";

// What the person asked for, checked, typed and ready to run. Anything wrong is a UsageError, with a
// message that says how to fix it. The tests are the spec: node:util's parseArgs does the fiddly part.
export type Command =
  | { name: "help" }
  | { name: "version" }
  | { name: "login"; email: string }
  | { name: "logout" }
  | { name: "events"; json: boolean }
  | { name: "buy"; eventId: number; quantity: number; phone: string; wait: boolean }
  | { name: "order"; orderId: number; json: boolean };

export class UsageError extends Error {}

export const COMMAND_NAMES = ["login", "logout", "events", "buy", "order", "help"] as const;
export const MAX_QUANTITY = 10;

// How many single-letter edits (add, remove, change) turn one word into the other.
export function editDistance(a: string, b: string): number {
  throw new Error(`TODO: editDistance(${a}, ${b})`);
}

// The nearest candidate, if it's at most two edits away. Ignores case.
export function closest(word: string, candidates: readonly string[]): string | null {
  throw new Error(`TODO: closest(${word}, ${candidates.length})`);
}

// "0712 345 678", "+254 712 345 678" and "254712345678" all become "0712345678". Anything else: null.
export function normalisePhone(text: string): string | null {
  throw new Error(`TODO: normalisePhone(${text})`);
}

export function parseCommand(argv: string[]): Command {
  const options: ParseArgsOptionsConfig = {};
  throw new Error(`TODO: parseCommand(${argv.join(" ")}) with ${typeof parseArgs}(${JSON.stringify(options)})`);
}
