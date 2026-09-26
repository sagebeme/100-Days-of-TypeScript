import type { Tier, TikitiEvent } from "./types.ts";

// Already written: one event and its tickets. Made up.
export const EVENT: TikitiEvent = {
  id: 1,
  title: "Jioni Jazz Night",
  venue: "Uhuru Gardens",
  startsAt: "2026-12-12T18:00:00+03:00",
  genre: "jazz",
  hue: 265,
  lineUp: [{ name: "The Jioni Collective", headliner: true }, { name: "Wambui Keys" }, { name: "Brass Matatu" }],
};

export const TIERS: Tier[] = [
  { id: "early", name: "Early bird", description: "The first 100 tickets.", priceKes: 1800, seats: 1, available: 0, maxPerOrder: 10 },
  { id: "regular", name: "Regular", description: "Standing, anywhere on the lawn.", priceKes: 2500, seats: 1, available: 212, maxPerOrder: 10 },
  { id: "vip", name: "VIP", description: "Seats by the stage and a drink on arrival.", priceKes: 6000, seats: 1, available: 12, maxPerOrder: 4 },
  { id: "group", name: "Group of 4", description: "Four regular tickets for the price of three and a bit.", priceKes: 8000, seats: 4, available: 30, maxPerOrder: 2 },
];
