import { describe, it, expect } from "vitest";
import { totals, formatKes, parseKes, nextNumber, dueDate, status, isKraPin, problems, type Invoice } from "./starter/invoice.ts";
import { renderInvoice, escapeHtml } from "./starter/render.ts";

const invoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  number: "INV-2026-0042",
  issued: "2026-12-01",
  termsDays: 14,
  from: { name: "Wanjiru Creative Studio", address: "Ngong Road\nNairobi", kraPin: "A012345678Z" },
  to: { name: "Tikiti Events Ltd", address: "Westlands\nNairobi" },
  items: [
    { description: "Event pages", quantity: 1, unitCents: 8_500_000, vat: 16 },
    { description: "Training", quantity: 2, unitCents: 500_000, vat: 0 },
  ],
  discountPercent: 0,
  ...overrides,
});

describe("totals", () => {
  it("adds up lines, VAT at 16% on the taxable ones, and the total", () => {
    expect(totals(invoice())).toEqual({
      lines: [
        { netCents: 8_500_000, vatCents: 1_360_000 },
        { netCents: 1_000_000, vatCents: 0 },
      ],
      subtotalCents: 9_500_000,
      discountCents: 0,
      netCents: 9_500_000,
      vatCents: 1_360_000,
      totalCents: 10_860_000,
    });
  });

  it("takes the discount off before VAT", () => {
    const t = totals(invoice({ discountPercent: 10 }));
    expect(t.discountCents).toBe(950_000);
    expect(t.vatCents).toBe(1_224_000); // 16% of the discounted 76,500
    expect(t.totalCents).toBe(8_550_000 + 1_224_000);
  });

  it("rounds each line to the cent, so the lines always add up to the totals", () => {
    const t = totals(invoice({ items: [{ description: "Hours", quantity: 1.5, unitCents: 3333, vat: 16 }] }));
    expect(t.lines[0]).toEqual({ netCents: 5000, vatCents: 800 }); // 49.995 rounds to 50.00; 16% of that is 8.00
    expect(t.totalCents).toBe(t.lines[0].netCents + t.lines[0].vatCents);
    for (const cents of Object.values(t).filter((v): v is number => typeof v === "number")) expect(Number.isInteger(cents)).toBe(true);
  });
});

describe("money in words people type", () => {
  it("formats cents as shillings", () => {
    expect(formatKes(10_860_000)).toBe("KES 108,600.00");
    expect(formatKes(5)).toBe("KES 0.05");
    expect(formatKes(-950_000)).toBe("−KES 9,500.00");
  });

  it("reads prices the way people type them", () => {
    expect(parseKes("85,000")).toBe(8_500_000);
    expect(parseKes("KES 1,234.5")).toBe(123_450);
    expect(parseKes("0.05")).toBe(5);
    for (const bad of ["", "abc", "1.234", "-5", "12,00.1.1"]) expect(parseKes(bad)).toBeNull();
  });
});

describe("the paperwork", () => {
  it("numbers invoices by year, never repeating", () => {
    expect(nextNumber([], 2026)).toBe("INV-2026-0001");
    expect(nextNumber(["INV-2026-0007", "INV-2026-0003", "INV-2025-0099"], 2026)).toBe("INV-2026-0008");
    expect(nextNumber(["INV-2026-0007"], 2027)).toBe("INV-2027-0001");
  });

  it("works out the due date and whether it's overdue", () => {
    expect(dueDate("2026-12-20", 14)).toBe("2027-01-03");
    expect(status(invoice(), "2026-12-15", false)).toBe("due");
    expect(status(invoice(), "2026-12-16", false)).toBe("overdue");
    expect(status(invoice(), "2027-01-30", true)).toBe("paid");
  });

  it("checks KRA PINs", () => {
    expect(isKraPin("A012345678Z")).toBe(true);
    expect(isKraPin(" p051234567k ")).toBe(true);
    for (const bad of ["A01234567Z", "1012345678Z", "A0123456789", ""]) expect(isKraPin(bad)).toBe(false);
  });

  it("lists everything wrong before an invoice is sent", () => {
    expect(problems(invoice())).toEqual([]);
    expect(
      problems(invoice({ to: { name: " ", address: "" }, items: [{ description: "", quantity: 0, unitCents: -1, vat: 16 }], discountPercent: 150, from: { name: "Me", address: "", kraPin: "nope" } })),
    ).toEqual([
      "Who is this invoice for?",
      "Item 1 needs a description",
      "Item 1: the quantity must be more than 0",
      "Item 1: the price must be 0 or more",
      "A discount is between 0% and 100%",
      "Your KRA PIN should look like A012345678Z",
    ]);
    expect(problems(invoice({ items: [] }))).toEqual(["Add at least one item"]);
  });
});

describe("the printable invoice", () => {
  it("shows the number, dates, parties, lines and totals", () => {
    const html = renderInvoice(invoice({ paybill: { business: "522533", account: "INV-2026-0042" } }));
    for (const part of ["INV-2026-0042", "1 December 2026", "15 December 2026", "Wanjiru Creative Studio", "Ngong Road<br>Nairobi", "KRA PIN: A012345678Z", "Event pages", "KES 85,000.00", "Exempt", "KES 13,600.00", "KES 108,600.00", "Paybill <strong>522533</strong>"]) {
      expect(html).toContain(part);
    }
    expect(html).not.toContain("Discount"); // no discount line when there's no discount
  });

  it("escapes everything typed, so a client name can't inject HTML", () => {
    const html = renderInvoice(invoice({ to: { name: '<img src=x onerror="alert(1)">', address: "" }, notes: "<b>hi</b>" }));
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).toContain("&lt;b&gt;hi&lt;/b&gt;");
    expect(escapeHtml(`'&'`)).toBe("&#39;&amp;&#39;");
  });

  it("shows the discount when there is one", () => {
    expect(renderInvoice(invoice({ discountPercent: 10 }))).toContain("Discount (10%)");
  });
});
