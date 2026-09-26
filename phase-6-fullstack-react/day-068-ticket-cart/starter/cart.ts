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

// TODO (a helper you'll want): the most of this tier the fan can have, given everything else in
// the cart, and why it stops there. Three limits, and the tightest one wins:
//   tier.available  -> "Early bird is sold out" when it's 0, otherwise "Only 2 VIP left"
//   tier.maxPerOrder -> "Up to 4 VIP per order"
//   seats left in the order (MAX_SEATS minus the seats of every OTHER tier, divided by tier.seats)
//                    -> "Up to 10 people per order"

// Already written: a new state with this tier at this quantity (a tier at 0 is removed), and a message.
export function withQuantity(state: CartState, tier: Tier, quantity: number, message: string | null): CartState {
  const quantities = { ...state.quantities }; // a new object: never change the old state
  if (quantity > 0) quantities[tier.id] = quantity;
  else delete quantities[tier.id];
  return { quantities, message };
}

// The reducer needs every tier to count seats across the cart, so it's made for a list of tiers.
export function makeCartReducer(allTiers: Tier[]) {
  return function cartReducer(state: CartState, action: CartAction): CartState {
    // TODO: one case per action type. Return a NEW state object every time something changes;
    // never change state.quantities itself. A tier going down to 0 is removed from quantities.
    // - increment: one more, unless that passes a limit: then keep the quantities, and set message to the reason.
    // - decrement: one fewer, never below 0.
    // - set: a typed number. Not a whole number of 0 or more: 0. Over a limit: the limit, and the reason.
    // - clear: emptyCart.
    // A change that works sets message back to null.
    void allTiers;
    void action;
    return state;
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
  // TODO: a line for every tier with a quantity (in the order of tiers), the seats (seatsIn), and the total.
  void state;
  void tiers;
  return { lines: [], seats: 0, totalKes: 0 };
}
