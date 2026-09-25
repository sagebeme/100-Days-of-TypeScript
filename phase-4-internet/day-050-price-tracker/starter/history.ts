import type { Product } from "./scrape.ts";

export interface PricePoint {
  date: string; // "2026-09-26"
  priceKes: number;
}

// Every SKU's prices over time. Only changes are stored, so the file stays small.
export type History = Record<string, PricePoint[]>;

export function record(history: History, products: Product[], date: string): History {
  // TODO: return a new History (don't change the old one). For each product, add { date, priceKes }
  //   to its list only if the list is empty or the last recorded price is different
  throw new Error("not implemented yet");
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
  // TODO: for each product, find the previous price: if the last point is from `date`, it's the point
  //   before that; otherwise it's the last point. No previous price -> trend "new", change 0.
  // TODO: otherwise changeKes = today - previous, trend "down" / "up" / "same", and lowestEver when
  //   the price went down to (or below) the lowest price ever recorded
  throw new Error("not implemented yet");
}

const kes = (amount: number) => `KES ${amount.toLocaleString("en-US")}`;
const SYMBOL: Record<Trend, string> = { new: "new", down: "▼", up: "▲", same: "=" };

export function formatTable(rows: Row[]): string {
  // TODO: the table in the README. The name column is as wide as the longest name (at least 7),
  //   then two spaces, the price right-aligned in 10, two spaces, then the change:
  //   "▼ KES 1,500" / "▲ KES 500" / "=" / "new", then "  (lowest ever, sold out)" when either applies
  throw new Error("not implemented yet");
}
