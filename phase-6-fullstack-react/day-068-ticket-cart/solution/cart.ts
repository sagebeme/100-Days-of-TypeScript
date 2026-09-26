import type { Tier } from "./types.ts";

// Everyone at the gate needs a ticket, and M-Pesa prompts are per order: 10 people per order at most.
export const MAX_SEATS = 10;

export interface CartState {
  quantities: Record<string, number>; // tier id -> how many. A tier with none isn't in here at all.
  message: string | null; // why the last change didn't go through, for the fan to read
}

export const emptyCart: CartState = { quantities: {}, message: null };

// Everything that can happen to a cart. Each action carries what the reducer needs to know, so
// the reducer stays pure: same state and action in, same state out, nothing else touched.
export type CartAction =
  | { type: "increment"; tier: Tier }
  | { type: "decrement"; tier: Tier }
  | { type: "set"; tier: Tier; quantity: number }
  | { type: "clear" };

export function seatsIn(quantities: Record<string, number>, tiers: Tier[]): number {
  return tiers.reduce((seats, tier) => seats + (quantities[tier.id] ?? 0) * tier.seats, 0);
}

// The most of this tier the fan can have, given everything else in the cart, and why it stops there.
function limitFor(state: CartState, tier: Tier, allTiers: Tier[]): { max: number; reason: string } {
  const others = seatsIn({ ...state.quantities, [tier.id]: 0 }, allTiers);
  const bySeats = Math.floor((MAX_SEATS - others) / tier.seats);
  const limits = [
    { max: tier.available, reason: tier.available === 0 ? `${tier.name} is sold out` : `Only ${tier.available} ${tier.name} left` },
    { max: tier.maxPerOrder, reason: `Up to ${tier.maxPerOrder} ${tier.name} per order` },
    { max: bySeats, reason: `Up to ${MAX_SEATS} people per order` },
  ];
  return limits.reduce((tightest, limit) => (limit.max < tightest.max ? limit : tightest));
}

function withQuantity(state: CartState, tier: Tier, quantity: number, message: string | null): CartState {
  const quantities = { ...state.quantities }; // a new object: never change the old state
  if (quantity > 0) quantities[tier.id] = quantity;
  else delete quantities[tier.id];
  return { quantities, message };
}

// The reducer needs every tier to count seats across the cart, so it's made for a list of tiers.
export function makeCartReducer(allTiers: Tier[]) {
  return function cartReducer(state: CartState, action: CartAction): CartState {
    switch (action.type) {
      case "increment": {
        const current = state.quantities[action.tier.id] ?? 0;
        const limit = limitFor(state, action.tier, allTiers);
        if (current + 1 > limit.max) return { ...state, message: limit.reason };
        return withQuantity(state, action.tier, current + 1, null);
      }
      case "decrement": {
        const current = state.quantities[action.tier.id] ?? 0;
        return withQuantity(state, action.tier, Math.max(0, current - 1), null);
      }
      case "set": {
        // Typed into a box: anything that isn't a whole number of 0 or more counts as 0.
        const wanted = Number.isInteger(action.quantity) && action.quantity > 0 ? action.quantity : 0;
        const limit = limitFor(state, action.tier, allTiers);
        if (wanted > limit.max) return withQuantity(state, action.tier, Math.max(0, limit.max), limit.reason);
        return withQuantity(state, action.tier, wanted, null);
      }
      case "clear":
        return emptyCart;
    }
  };
}

export interface CartLine {
  tier: Tier;
  quantity: number;
  totalKes: number;
}

export interface CartSummary {
  lines: CartLine[];
  seats: number;
  totalKes: number;
}

// Worked out from the state every time, never stored: a total that's stored can go stale.
export function summarise(state: CartState, tiers: Tier[]): CartSummary {
  const lines = tiers
    .filter((tier) => (state.quantities[tier.id] ?? 0) > 0)
    .map((tier) => ({ tier, quantity: state.quantities[tier.id], totalKes: state.quantities[tier.id] * tier.priceKes }));
  return {
    lines,
    seats: seatsIn(state.quantities, tiers),
    totalKes: lines.reduce((sum, line) => sum + line.totalKes, 0),
  };
}
