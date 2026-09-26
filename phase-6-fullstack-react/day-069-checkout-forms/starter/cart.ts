// Already written: what's in the cart when the fan reaches checkout (Day 68 would hand this over).
export const PRICES: Record<string, { name: string; priceKes: number }> = {
  regular: { name: "Regular", priceKes: 2500 },
  vip: { name: "VIP", priceKes: 6000 },
  group: { name: "Group of 4", priceKes: 8000 },
};

export const CART = [
  { tierId: "vip", quantity: 2 },
  { tierId: "group", quantity: 1 },
];

export const totalOf = (lines: { tierId: string; quantity: number }[]) =>
  lines.reduce((sum, line) => sum + (PRICES[line.tierId]?.priceKes ?? 0) * line.quantity, 0);
