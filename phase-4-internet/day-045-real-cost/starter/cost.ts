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
  // TODO: throw "The item must cost something, and shipping can't be negative" for bad input
  // TODO: every line rounded to whole shillings, in this order (see the README for each formula):
  //   Item, Shipping, Bank's dollar fee, Import duty, IDF, Railway levy, VAT, Clearing
  // TODO: totalKes adds up the lines; stickerKes is just the item
  throw new Error("not implemented yet");
}

export function formatCost(cost: LandedCost): string {
  // TODO: the table in the README: labels padded to the longest label + 2,
  //   amounts ("KES 15,522") padded to 12 on the left, a line of dashes, the total,
  //   a blank line, and "That's 103% more than the KES 15,522 on the website."
  throw new Error("not implemented yet");
}
