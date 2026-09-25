import type { Product } from "./scrape.ts";

export interface PricePoint {
  date: string; // "2026-09-26"
  priceKes: number;
}

// Every SKU's prices over time. Only changes are stored, so the file stays small.
export type History = Record<string, PricePoint[]>;

export function record(history: History, products: Product[], date: string): History {
  const next: History = { ...history };
  for (const product of products) {
    const points = next[product.sku] ?? [];
    const last = points.at(-1);
    if (last?.priceKes !== product.priceKes) {
      next[product.sku] = [...points, { date, priceKes: product.priceKes }];
    }
  }
  return next;
}

export type Trend = "new" | "down" | "up" | "same";

export interface Row {
  product: Product;
  trend: Trend;
  changeKes: number; // negative when the price dropped
  lowestEver: boolean;
}

// How each product's price on `date` compares with its price before that.
export function compare(history: History, products: Product[], date: string): Row[] {
  return products.map((product) => {
    const points = history[product.sku] ?? [];
    const last = points.at(-1);
    // A point recorded today is today's price, so the one before it is the previous price.
    // Otherwise the price hasn't changed since the last recorded point.
    const previous = last?.date === date ? points.at(-2) : last;
    const lowest = Math.min(...points.map((p) => p.priceKes), product.priceKes);

    if (previous === undefined) {
      return { product, trend: "new", changeKes: 0, lowestEver: false };
    }
    const changeKes = product.priceKes - previous.priceKes;
    const trend: Trend = changeKes < 0 ? "down" : changeKes > 0 ? "up" : "same";
    return { product, trend, changeKes, lowestEver: trend === "down" && product.priceKes <= lowest };
  });
}

const kes = (amount: number) => `KES ${amount.toLocaleString("en-US")}`;
const SYMBOL: Record<Trend, string> = { new: "new", down: "▼", up: "▲", same: "=" };

export function formatTable(rows: Row[]): string {
  const nameWidth = Math.max(...rows.map((r) => r.product.name.length), 7);
  const lines = [`${"Product".padEnd(nameWidth)}  ${"Price".padStart(10)}  Change`];
  for (const row of rows) {
    const change =
      row.trend === "down" || row.trend === "up"
        ? `${SYMBOL[row.trend]} ${kes(Math.abs(row.changeKes))}`
        : SYMBOL[row.trend];
    const notes = [row.lowestEver ? "lowest ever" : "", row.product.inStock ? "" : "sold out"].filter(Boolean);
    lines.push(
      `${row.product.name.padEnd(nameWidth)}  ${kes(row.product.priceKes).padStart(10)}  ${change}${notes.length ? `  (${notes.join(", ")})` : ""}`,
    );
  }
  return lines.join("\n");
}
