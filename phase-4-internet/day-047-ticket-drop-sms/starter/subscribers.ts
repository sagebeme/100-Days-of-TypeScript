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
  // TODO: normalize every number. Ones that don't normalize go in `invalid` (as they were typed).
  // TODO: leave out duplicates, and anyone whose normalized number is in `optedOut`
  throw new Error("not implemented yet");
}
