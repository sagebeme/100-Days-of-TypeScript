import { findItem } from "./menu.ts";

export function orderTotal(itemNames: string[]): number {
  let total = 0;
  for (const name of itemNames) {
    const item = findItem(name);
    if (item === undefined) {
      throw new Error(`Unknown item: ${name}`);
    }
    total += item.price;
  }
  return total;
}
