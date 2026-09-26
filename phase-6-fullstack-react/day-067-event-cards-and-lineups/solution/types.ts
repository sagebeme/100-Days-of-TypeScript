// Already written: the shape of an event, as the Day 66 API sends it, plus what the web app shows.
export const GENRES = ["afrobeats", "benga", "gengetone", "jazz", "comedy", "rhumba"] as const;
export type Genre = (typeof GENRES)[number];

export interface Act {
  name: string;
  headliner?: boolean;
}

export interface TikitiEvent {
  id: number;
  title: string;
  venue: string;
  startsAt: string; // ISO date and time, with its offset: "2026-12-12T18:00:00+03:00"
  priceKes: number;
  capacity: number;
  available: number; // seats still on sale
  status: "published" | "cancelled";
  genre: Genre;
  lineUp: Act[];
  hue: number; // 0 to 360: the colour of the poster art
}
