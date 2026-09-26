import { dueDate, formatKes, totals, type Invoice, type Party } from "./invoice.ts";

// The invoice as a printable page: A4, black on white, every piece of text escaped (a client's name
// is typed by somebody, and could contain anything).
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const longDate = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function party(title: string, p: Party): string {
  const lines = [p.name, ...p.address.split("\n")].filter((l) => l.trim()).map(escapeHtml);
  return `<div class="party"><h3>${title}</h3><p>${lines.join("<br>")}</p>${p.kraPin ? `<p class="pin">KRA PIN: ${escapeHtml(p.kraPin.toUpperCase())}</p>` : ""}${p.email ? `<p>${escapeHtml(p.email)}</p>` : ""}</div>`;
}

export function renderInvoice(invoice: Invoice): string {
  const t = totals(invoice);
  const qty = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, ""));
  const rows = invoice.items
    .map(
      (item, i) => `<tr>
  <td>${escapeHtml(item.description)}</td>
  <td class="num">${qty(item.quantity)}</td>
  <td class="num">${formatKes(item.unitCents)}</td>
  <td class="num">${item.vat ? "16%" : "Exempt"}</td>
  <td class="num">${formatKes(t.lines[i].netCents)}</td>
</tr>`,
    )
    .join("\n");
  return `<article class="invoice" aria-label="Invoice ${escapeHtml(invoice.number)}">
<header class="head">
  <div><h1>Invoice</h1><p class="number">${escapeHtml(invoice.number)}</p></div>
  <dl class="dates">
    <div><dt>Issued</dt><dd>${longDate(invoice.issued)}</dd></div>
    <div><dt>Due</dt><dd>${longDate(dueDate(invoice.issued, invoice.termsDays))}</dd></div>
  </dl>
</header>
<section class="parties">${party("From", invoice.from)}${party("Bill to", invoice.to)}</section>
<table class="lines">
  <thead><tr><th>Description</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">VAT</th><th class="num">Amount</th></tr></thead>
  <tbody>
${rows}
  </tbody>
</table>
<dl class="totals">
  <div><dt>Subtotal</dt><dd>${formatKes(t.subtotalCents)}</dd></div>
  ${t.discountCents ? `<div><dt>Discount (${invoice.discountPercent}%)</dt><dd>${formatKes(-t.discountCents)}</dd></div>` : ""}
  <div><dt>VAT</dt><dd>${formatKes(t.vatCents)}</dd></div>
  <div class="grand"><dt>Total due</dt><dd>${formatKes(t.totalCents)}</dd></div>
</dl>
${invoice.paybill ? `<section class="pay"><h3>Pay with M-Pesa</h3><p>Paybill <strong>${escapeHtml(invoice.paybill.business)}</strong>, account <strong>${escapeHtml(invoice.paybill.account)}</strong>, amount <strong>${formatKes(t.totalCents)}</strong>.</p></section>` : ""}
${invoice.notes?.trim() ? `<p class="notes">${escapeHtml(invoice.notes).replace(/\n/g, "<br>")}</p>` : ""}
</article>`;
}
