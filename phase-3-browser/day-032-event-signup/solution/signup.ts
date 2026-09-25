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
  const digits = raw.replace(/[\s-]/g, "");
  const local = /^0([17]\d{8})$/.exec(digits);
  if (local) {
    return `+254${local[1]}`;
  }
  const international = /^\+?254([17]\d{8})$/.exec(digits);
  if (international) {
    return `+254${international[1]}`;
  }
  return null;
}

export function isTicket(value: string): value is Ticket {
  return (TICKETS as readonly string[]).includes(value);
}

function text(data: FormData, field: string): string {
  const value = data.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export function parseSignup(data: FormData): SignupResult {
  const errors: FieldErrors = {};

  const name = text(data, "name");
  if (name.length < 2) {
    errors.name = "Enter your name";
  }

  const email = text(data, "email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email";
  }

  const phone = normalizePhone(text(data, "phone"));
  if (phone === null) {
    errors.phone = "Enter a Kenyan number like 0712 345 678";
  }

  const ticket = text(data, "ticket");
  if (!isTicket(ticket)) {
    errors.ticket = "Pick a ticket type";
  }

  const guestsText = text(data, "guests");
  const guests = guestsText === "" ? 0 : Number(guestsText);
  if (!Number.isInteger(guests) || guests < 0 || guests > 3) {
    errors.guests = "Guests must be 0 to 3";
  }

  // Checking phone and ticket again narrows their types for the value below.
  if (Object.keys(errors).length > 0 || phone === null || !isTicket(ticket)) {
    return { ok: false, errors };
  }
  return { ok: true, value: { name, email, phone, ticket, guests } };
}
