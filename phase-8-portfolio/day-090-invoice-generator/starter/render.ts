import type { Invoice } from "./invoice.ts";

// The invoice as HTML, ready to print. Escape everything that was typed.
export function escapeHtml(text: string): string {
  throw new Error(`TODO: escapeHtml(${text})`);
}

export function renderInvoice(invoice: Invoice): string {
  throw new Error(`TODO: renderInvoice(${invoice.number})`);
}
