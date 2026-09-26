import { parseArgs, type ParseArgsOptionsConfig } from "node:util";

// What the person asked for, checked, typed and ready to run. Anything wrong is a UsageError, with a
// message that says how to fix it.
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

// How many single-letter edits turn one word into the other.
export function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(previous[j] + 1, row[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = row;
  }
  return previous[b.length];
}

export function closest(word: string, candidates: readonly string[]): string | null {
  let best: string | null = null;
  let bestDistance = 3; // more than two edits away isn't a typo
  for (const candidate of candidates) {
    const d = editDistance(word.toLowerCase(), candidate);
    if (d < bestDistance) [best, bestDistance] = [candidate, d];
  }
  return best;
}

const wholeNumber = (text: string | undefined, what: string, command: string): number => {
  if (text === undefined) throw new UsageError(`tikiti ${command}: say which ${what}, like "tikiti ${command} 12"`);
  if (!/^\d+$/.test(text) || Number(text) < 1) throw new UsageError(`tikiti ${command}: "${text}" isn't a ${what} number`);
  return Number(text);
};

// "0712 345 678", "+254 712 345 678" and "254712345678" are all the same Safaricom-style number.
export function normalisePhone(text: string): string | null {
  const digits = text.replace(/[\s-]/g, "");
  const match = /^(?:\+?254|0)([17]\d{8})$/.exec(digits);
  return match ? `0${match[1]}` : null;
}

export function parseCommand(argv: string[]): Command {
  const [first, ...rest] = argv;
  if (first === undefined || first === "help" || first === "--help" || first === "-h") return { name: "help" };
  if (first === "--version" || first === "-v") return { name: "version" };

  const parse = <const O extends ParseArgsOptionsConfig>(options: O) => {
    try {
      return parseArgs({ args: rest, options, allowPositionals: true, strict: true });
    } catch (error) {
      const message = (error as Error).message.split("\n")[0].replace(/\. To specify a positional.*$/, "");
      throw new UsageError(`tikiti ${first}: ${message}`);
    }
  };
  const noMorePositionals = (positionals: string[], allowed: number) => {
    if (positionals.length > allowed) throw new UsageError(`tikiti ${first}: didn't expect "${positionals[allowed]}"`);
  };

  switch (first) {
    case "login": {
      const { positionals } = parse({});
      noMorePositionals(positionals, 1);
      const email = positionals[0];
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new UsageError('tikiti login: give your email, like "tikiti login amina@example.com"');
      return { name: "login", email };
    }
    case "logout": {
      const { positionals } = parse({});
      noMorePositionals(positionals, 0);
      return { name: "logout" };
    }
    case "events": {
      const { values, positionals } = parse({ json: { type: "boolean" } });
      noMorePositionals(positionals, 0);
      return { name: "events", json: values.json === true };
    }
    case "order": {
      const { values, positionals } = parse({ json: { type: "boolean" } });
      noMorePositionals(positionals, 1);
      return { name: "order", orderId: wholeNumber(positionals[0], "order", "order"), json: values.json === true };
    }
    case "buy": {
      const { values, positionals } = parse({
        quantity: { type: "string", short: "q" },
        phone: { type: "string", short: "p" },
        "no-wait": { type: "boolean" },
      });
      noMorePositionals(positionals, 1);
      const eventId = wholeNumber(positionals[0], "event", "buy");
      const quantityText = values.quantity ?? "1";
      const quantity = Number(quantityText);
      if (!/^\d+$/.test(quantityText) || quantity < 1 || quantity > MAX_QUANTITY) {
        throw new UsageError(`tikiti buy: --quantity must be a whole number from 1 to ${MAX_QUANTITY}`);
      }
      if (values.phone === undefined) throw new UsageError("tikiti buy: say which phone M-Pesa should ask, like --phone 0712345678");
      const phone = normalisePhone(values.phone);
      if (!phone) throw new UsageError(`tikiti buy: "${values.phone}" isn't an M-Pesa number. Try 07XXXXXXXX`);
      return { name: "buy", eventId, quantity, phone, wait: values["no-wait"] !== true };
    }
    default: {
      const guess = closest(first, COMMAND_NAMES);
      throw new UsageError(`Unknown command "${first}".${guess ? ` Did you mean "${guess}"?` : ""}`);
    }
  }
}
