export interface Order {
  itemUsd: number;
  shippingUsd: number;
}

// A simplified model of what it costs to bring a parcel into Kenya.
// These are example rates for learning: real duty depends on what you're importing,
// so check KRA's current rates before you rely on the number.
export interface CostRules {
  dutyRate: number; // import duty, on the customs value
  idfRate: number; // import declaration fee
  rdlRate: number; // railway development levy
  vatRate: number; // VAT, on the customs value plus duty
  cardFxRate: number; // what your bank adds for paying in dollars
  clearingKes: number; // the courier's flat handling fee
}

export const EXAMPLE_RULES: CostRules = {
  dutyRate: 0.25,
  idfRate: 0.025,
  rdlRate: 0.02,
  vatRate: 0.16,
  cardFxRate: 0.03,
  clearingKes: 1000,
};

export interface CostLine {
  label: string;
  kes: number;
}

export interface LandedCost {
  lines: CostLine[];
  totalKes: number;
  stickerKes: number; // what the website made it look like: just the item, converted
}

export function landedCost(order: Order, kesPerDollar: number, rules: CostRules): LandedCost {
  if (order.itemUsd <= 0 || order.shippingUsd < 0) {
    throw new Error("The item must cost something, and shipping can't be negative");
  }

  const item = Math.round(order.itemUsd * kesPerDollar);
  const shipping = Math.round(order.shippingUsd * kesPerDollar);
  const customsValue = item + shipping;
  const duty = Math.round(customsValue * rules.dutyRate);

  const lines: CostLine[] = [
    { label: "Item", kes: item },
    { label: "Shipping", kes: shipping },
    { label: "Bank's dollar fee", kes: Math.round(customsValue * rules.cardFxRate) },
    { label: "Import duty", kes: duty },
    { label: "IDF", kes: Math.round(customsValue * rules.idfRate) },
    { label: "Railway levy", kes: Math.round(customsValue * rules.rdlRate) },
    { label: "VAT", kes: Math.round((customsValue + duty) * rules.vatRate) },
    { label: "Clearing", kes: rules.clearingKes },
  ];

  return { lines, totalKes: lines.reduce((sum, line) => sum + line.kes, 0), stickerKes: item };
}

const kes = (amount: number) => `KES ${amount.toLocaleString("en-US")}`;

export function formatCost(cost: LandedCost): string {
  const width = Math.max(...cost.lines.map((line) => line.label.length), "Total".length) + 2;
  const rows = cost.lines.map((line) => `${line.label.padEnd(width)}${kes(line.kes).padStart(12)}`);
  const extra = cost.totalKes / cost.stickerKes - 1;
  return [
    ...rows,
    "-".repeat(width + 12),
    `${"Total".padEnd(width)}${kes(cost.totalKes).padStart(12)}`,
    "",
    `That's ${Math.round(extra * 100)}% more than the ${kes(cost.stickerKes)} on the website.`,
  ].join("\n");
}
