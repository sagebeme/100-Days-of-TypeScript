export interface BillSplit {
  tip: number;
  grandTotal: number;
  perPerson: number;
}

export function splitBill(total: number, people: number, tipPercent: number): BillSplit {
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("Enter a total above 0");
  }
  if (!Number.isInteger(people) || people < 1) {
    throw new Error("Enter how many people are paying");
  }
  if (tipPercent < 0) {
    throw new Error("Tip can't be negative");
  }

  const tip = Math.round((total * tipPercent) / 100);
  const grandTotal = total + tip;
  return { tip, grandTotal, perPerson: Math.ceil(grandTotal / people) };
}

export function formatKes(amount: number): string {
  return `KES ${amount.toLocaleString("en-US")}`;
}
