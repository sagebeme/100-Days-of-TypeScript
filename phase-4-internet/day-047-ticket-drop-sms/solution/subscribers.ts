// Day 32's phone check: every number ends up as +254 and 9 digits, or null.
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[\s-]/g, "");
  const local = /^0([17]\d{8})$/.exec(digits);
  if (local) return `+254${local[1]}`;
  const international = /^\+?254([17]\d{8})$/.exec(digits);
  if (international) return `+254${international[1]}`;
  return null;
}

export interface SubscriberList {
  numbers: string[];
  invalid: string[];
}

// Clean, de-duplicated numbers, leaving out anyone who texted STOP.
export function subscribersFrom(raw: string[], optedOut: string[]): SubscriberList {
  const stopped = new Set(optedOut.map(normalizePhone).filter((n): n is string => n !== null));
  const numbers = new Set<string>();
  const invalid: string[] = [];
  for (const entry of raw) {
    const number = normalizePhone(entry);
    if (number === null) invalid.push(entry);
    else if (!stopped.has(number)) numbers.add(number);
  }
  return { numbers: [...numbers], invalid };
}
