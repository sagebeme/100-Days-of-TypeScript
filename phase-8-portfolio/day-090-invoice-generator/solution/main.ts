import { nextNumber, parseKes, problems, type Invoice, type LineItem } from "./invoice.ts";
import { renderInvoice } from "./render.ts";

// The page: a form on the left, the invoice on the right, updated as you type.
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const form = $<HTMLFormElement>("editor");
const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement;
const today = new Date().toLocaleDateString("en-CA");

let items: { description: string; quantity: string; price: string; vat: "16" | "0" }[] = [
  { description: "Website design: Tikiti event pages", quantity: "1", price: "85,000", vat: "16" },
  { description: "M-Pesa checkout integration", quantity: "12", price: "3,500", vat: "16" },
  { description: "Training session (exempt)", quantity: "2", price: "5,000", vat: "0" },
];

const defaults: Record<string, string> = {
  fromName: "Wanjiru Creative Studio",
  fromAddress: "Ngong Road, Kilimani\nNairobi",
  fromPin: "A012345678Z",
  fromEmail: "wanjiru@studio.example",
  toName: "Tikiti Events Ltd",
  toAddress: "Westlands Business Centre\nNairobi",
  toPin: "",
  number: nextNumber([], new Date().getFullYear()),
  issued: today,
  discount: "0",
  paybill: "522533",
  account: "",
  notes: "Thank you for your business! Questions about this invoice: wanjiru@studio.example",
};
for (const [name, value] of Object.entries(defaults)) field(name).value = value;

function renderItems(): void {
  $("items").replaceChildren(
    ...items.map((item, i) => {
      const row = document.createElement("div");
      row.className = "item";
      row.innerHTML = `<label>Description <input data-key="description" /></label><label>Qty <input data-key="quantity" inputmode="decimal" /></label><label>Unit price <input data-key="price" inputmode="decimal" /></label><label>VAT <select data-key="vat"><option value="16">16%</option><option value="0">Exempt</option></select></label><button type="button" aria-label="Remove item ${i + 1}">✕</button>`;
      for (const input of row.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-key]")) {
        const key = input.dataset.key as keyof (typeof items)[number];
        input.value = item[key];
        input.addEventListener("input", () => ((items[i] = { ...items[i], [key]: input.value }), update()));
      }
      row.querySelector("button")!.addEventListener("click", () => ((items = items.filter((_, j) => j !== i)), renderItems(), update()));
      return row;
    }),
  );
}

function read(): { invoice: Invoice; typos: string[] } {
  const typos: string[] = [];
  const lineItems: LineItem[] = items.map((item, i) => {
    const cents = parseKes(item.price);
    if (cents === null && item.price.trim()) typos.push(`Item ${i + 1}: "${item.price}" isn't a price`);
    return { description: item.description, quantity: Number(item.quantity), unitCents: cents ?? 0, vat: item.vat === "0" ? 0 : 16 };
  });
  const number = field("number").value.trim();
  const paybill = field("paybill").value.trim();
  const invoice: Invoice = {
    number,
    issued: field("issued").value,
    termsDays: Number(field("terms").value),
    from: { name: field("fromName").value, address: field("fromAddress").value, kraPin: field("fromPin").value.trim() || undefined, email: field("fromEmail").value.trim() || undefined },
    to: { name: field("toName").value, address: field("toAddress").value, kraPin: field("toPin").value.trim() || undefined },
    items: lineItems,
    discountPercent: Number(field("discount").value || 0),
    paybill: paybill ? { business: paybill, account: field("account").value.trim() || number } : undefined,
    notes: field("notes").value,
  };
  return { invoice, typos };
}

function update(): void {
  const { invoice, typos } = read();
  $("paper").innerHTML = renderInvoice(invoice); // renderInvoice escapes everything that was typed
  const list = [...typos, ...problems(invoice)];
  $("problems").replaceChildren(...list.map((p) => Object.assign(document.createElement("li"), { textContent: p })));
  document.title = `${invoice.number} · ${invoice.to.name || "Invoice"}`; // the PDF's file name
}

form.addEventListener("input", update);
$("add-item").addEventListener("click", () => {
  items = [...items, { description: "", quantity: "1", price: "", vat: "16" }];
  renderItems();
  update();
  ($("items").lastElementChild?.querySelector("input") as HTMLInputElement | null)?.focus();
});
$("print").addEventListener("click", () => window.print());

renderItems();
update();
