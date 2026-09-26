// Invoices, Kenyan style, in whole cents. The tests are the spec.
export const VAT_RATE = 16;

export interface LineItem {
  description: string;
  quantity: number;
  unitCents: number;
  vat: 16 | 0;
}

export interface Party {
  name: string;
  address: string;
  kraPin?: string;
  email?: string;
}

export interface Invoice {
  number: string;
  issued: string; // YYYY-MM-DD
  termsDays: number;
  from: Party;
  to: Party;
  items: LineItem[];
  discountPercent: number;
  paybill?: { business: string; account: string };
  notes?: string;
}

export interface Totals {
  lines: { netCents: number; vatCents: number }[];
  subtotalCents: number;
  discountCents: number;
  netCents: number;
  vatCents: number;
  totalCents: number;
}

export function totals(invoice: Invoice): Totals {
  throw new Error(`TODO: totals(${invoice.number})`);
}

export function formatKes(cents: number): string {
  throw new Error(`TODO: formatKes(${cents})`);
}

export function parseKes(text: string): number | null {
  throw new Error(`TODO: parseKes(${text})`);
}

export function nextNumber(existing: string[], year: number): string {
  throw new Error(`TODO: nextNumber(${existing.length}, ${year})`);
}

export function dueDate(issued: string, termsDays: number): string {
  throw new Error(`TODO: dueDate(${issued}, ${termsDays})`);
}

export function status(invoice: Invoice, today: string, paid: boolean): "paid" | "due" | "overdue" {
  throw new Error(`TODO: status(${invoice.number}, ${today}, ${paid})`);
}

export function isKraPin(pin: string): boolean {
  throw new Error(`TODO: isKraPin(${pin})`);
}

export function problems(invoice: Invoice): string[] {
  throw new Error(`TODO: problems(${invoice.number})`);
}
