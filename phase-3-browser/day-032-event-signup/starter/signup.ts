export const TICKETS = ["regular", "vip", "student"] as const;
export type Ticket = (typeof TICKETS)[number];

export const TICKET_LABELS: Record<Ticket, string> = {
  regular: "Regular",
  vip: "VIP",
  student: "Student",
};

export interface Signup {
  name: string;
  email: string;
  phone: string;
  ticket: Ticket;
  guests: number;
}

export type FieldErrors = Partial<Record<keyof Signup, string>>;

export type SignupResult = { ok: true; value: Signup } | { ok: false; errors: FieldErrors };

export function normalizePhone(raw: string): string | null {
  // TODO: remove spaces and dashes
  // TODO: "0712345678" / "0110123456"         -> "+254712345678" / "+254110123456"
  // TODO: "254712345678" / "+254712345678"    -> "+254712345678"
  // TODO: anything else -> null
  throw new Error("not implemented yet");
}

export function isTicket(value: string): value is Ticket {
  // TODO: true if value is one of TICKETS
  throw new Error("not implemented yet");
}

export function parseSignup(data: FormData): SignupResult {
  // TODO: read each field as trimmed text ("" if it's missing or not a string)
  // TODO: check every field (see the table in the README), collecting ALL the errors
  // TODO: return { ok: false, errors } if there are any, otherwise { ok: true, value }
  throw new Error("not implemented yet");
}
