// Already written.
export interface TikitiEvent {
  id: number;
  title: string;
  venue: string;
  startsAt: string;
  genre: string;
  hue: number;
  lineUp: { name: string; headliner?: boolean }[];
}

// A kind of ticket. A "Group of 4" is one ticket that lets 4 people in: seats is 4.
export interface Tier {
  id: string;
  name: string;
  description: string;
  priceKes: number;
  seats: number; // people it lets in
  available: number; // how many of this tier are left
  maxPerOrder: number;
}
