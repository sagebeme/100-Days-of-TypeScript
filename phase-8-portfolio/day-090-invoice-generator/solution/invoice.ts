// Invoices, Kenyan style. Money is whole cents, never floats: 0.1 + 0.2 isn't 0.3 in floating point,
// and an invoice that's a cent out makes an accountant very unhappy.

export const VAT_RATE = 16; // % in Kenya; some things are exempt (0)

export interface LineItem {
  description: string;
  quantity: number; // may be fractional: 1.5 hours
  unitCents: number; // price per unit, in cents
  vat: 16 | 0;
}

export interface Party {
  name: string;
  address: string;
  kraPin?: string;
  email?: string;
}

export interface Invoice {
  number: string; // "INV-2026-0042"
  issued: string; // YYYY-MM-DD
  termsDays: number; // payment due this many days after issue
  from: Party;
  to: Party;
  items: LineItem[];
  discountPercent: number; // off everything before VAT
  paybill?: { business: string; account: string }; // M-Pesa
  notes?: string;
}

export interface Totals {
  lines: { netCents: number; vatCents: number }[];
  subtotalCents: number; // before discount and VAT
  discountCents: number;
  netCents: number; // after discount, before VAT
  vatCents: number;
  totalCents: number;
}

// Rounds half away from zero, to whole cents.
const round = (cents: number) => Math.sign(cents) * Math.round(Math.abs(cents));

export function totals(invoice: Invoice): Totals {
  const discount = invoice.discountPercent / 100;
  // Each line is rounded on its own, the way it appears on the page, so the lines add up to the totals.
  const lines = invoice.items.map((item) => {
    const gross = round(item.quantity * item.unitCents);
    const net = gross - round(gross * discount);
    return { grossCents: gross, netCents: net, vatCents: round((net * item.vat) / 100) };
  });
  const subtotal = lines.reduce((s, l) => s + l.grossCents, 0);
  const net = lines.reduce((s, l) => s + l.netCents, 0);
  const vat = lines.reduce((s, l) => s + l.vatCents, 0);
  return { lines: lines.map(({ netCents, vatCents }) => ({ netCents, vatCents })), subtotalCents: subtotal, discountCents: subtotal - net, netCents: net, vatCents: vat, totalCents: net + vat };
}

// "KES 12,345.67"
export function formatKes(cents: number): string {
  const sign = cents < 0 ? "−" : "";
  return `${sign}KES ${(Math.abs(cents) / 100).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// "1,234.5" or "1234.50" typed by a person -> cents. null if it isn't a price.
export function parseKes(text: string): number | null {
  const cleaned = text.replace(/kes|ksh|,|\s/gi, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

// The next invoice number: numbering restarts each year, and never repeats.
export function nextNumber(existing: string[], year: number): string {
  const prefix = `INV-${year}-`;
  const highest = existing.filter((n) => n.startsWith(prefix)).map((n) => Number(n.slice(prefix.length))).filter(Number.isInteger).reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}${String(highest + 1).padStart(4, "0")}`;
}

export function dueDate(issued: string, termsDays: number): string {
  const date = new Date(`${issued}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + termsDays);
  return date.toISOString().slice(0, 10);
}

export function status(invoice: Invoice, today: string, paid: boolean): "paid" | "due" | "overdue" {
  if (paid) return "paid";
  return today > dueDate(invoice.issued, invoice.termsDays) ? "overdue" : "due";
}

// A KRA PIN: a letter, 9 digits, a letter. "A012345678Z".
export const isKraPin = (pin: string) => /^[AP]\d{9}[A-Z]$/.test(pin.trim().toUpperCase());

// Everything wrong with an invoice, in words, before it's sent.
export function problems(invoice: Invoice): string[] {
  const list: string[] = [];
  if (!invoice.from.name.trim()) list.push("Add your business name");
  if (!invoice.to.name.trim()) list.push("Who is this invoice for?");
  if (invoice.items.length === 0) list.push("Add at least one item");
  invoice.items.forEach((item, i) => {
    if (!item.description.trim()) list.push(`Item ${i + 1} needs a description`);
    if (!(item.quantity > 0)) list.push(`Item ${i + 1}: the quantity must be more than 0`);
    if (!Number.isInteger(item.unitCents) || item.unitCents < 0) list.push(`Item ${i + 1}: the price must be 0 or more`);
  });
  if (invoice.discountPercent < 0 || invoice.discountPercent > 100) list.push("A discount is between 0% and 100%");
  if (invoice.from.kraPin && !isKraPin(invoice.from.kraPin)) list.push("Your KRA PIN should look like A012345678Z");
  if (invoice.to.kraPin && !isKraPin(invoice.to.kraPin)) list.push("The client's KRA PIN should look like A012345678Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(invoice.issued)) list.push("The issue date is missing");
  return list;
}
