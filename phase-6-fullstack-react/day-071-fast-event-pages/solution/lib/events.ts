// Already written: where the events come from. In Day 74 this is the ticketing API's database; here
// it's a list, with a delay like a real database's, so you can feel what Next does about waiting.
export interface Act {
  name: string;
  headliner?: boolean;
}

export interface TikitiEvent {
  id: number;
  slug: string;
  title: string;
  venue: string;
  address: string;
  startsAt: string;
  endsAt: string;
  priceKes: number;
  capacity: number;
  available: number;
  status: "published" | "cancelled" | "draft";
  genre: string;
  hue: number;
  lineUp: Act[];
  description: string;
}

const EVENTS: TikitiEvent[] = [
  {
    id: 1, slug: "jioni-jazz-night", title: "Jioni Jazz Night", venue: "Uhuru Gardens", address: "Lang'ata Road, Nairobi",
    startsAt: "2026-12-12T18:00:00+03:00", endsAt: "2026-12-12T23:00:00+03:00", priceKes: 2500, capacity: 500, available: 212,
    status: "published", genre: "jazz", hue: 265,
    lineUp: [{ name: "The Jioni Collective", headliner: true }, { name: "Wambui Keys" }, { name: "Brass Matatu" }],
    description: "Five hours of jazz under the Nairobi sky, from late-afternoon brass to midnight piano. Bring a blanket: the lawn gets cold after nine.",
  },
  {
    id: 2, slug: "gengetone-block-party", title: "Gengetone Block Party", venue: "Kasarani Annex", address: "Thika Road, Nairobi",
    startsAt: "2026-12-05T15:00:00+03:00", endsAt: "2026-12-05T23:30:00+03:00", priceKes: 800, capacity: 1200, available: 14,
    status: "published", genre: "gengetone", hue: 18,
    lineUp: [{ name: "Mtaa Sound", headliner: true }, { name: "Odi Rider", headliner: true }, { name: "Kaka Bass" }, { name: "DJ Shiko" }],
    description: "The loudest afternoon of the year. Two headliners, one stage, and a sound system you'll feel in your chest from the car park.",
  },
  {
    id: 3, slug: "benga-sundowner", title: "Benga Sundowner", venue: "Karura Forest Glade", address: "Limuru Road, Nairobi",
    startsAt: "2026-12-06T16:30:00+03:00", endsAt: "2026-12-06T21:00:00+03:00", priceKes: 1500, capacity: 300, available: 0,
    status: "published", genre: "benga", hue: 150,
    lineUp: [{ name: "Nyanza Strings", headliner: true }, { name: "Achieng & the Lakeside Band" }],
    description: "Benga guitars in a forest clearing as the sun goes down. Small, seated, and sold out every year.",
  },
  {
    id: 4, slug: "laugh-industry-live", title: "Laugh Industry Live", venue: "Alliance Française Garden", address: "Loita Street, Nairobi",
    startsAt: "2026-12-10T19:30:00+03:00", endsAt: "2026-12-10T22:00:00+03:00", priceKes: 1000, capacity: 250, available: 180,
    status: "cancelled", genre: "comedy", hue: 330,
    lineUp: [{ name: "Kamau Punchline", headliner: true }, { name: "Nduta Says" }],
    description: "Stand-up in English, Kiswahili and Sheng from two of Nairobi's sharpest young comics.",
  },
  {
    id: 5, slug: "afrobeats-in-the-park", title: "Afrobeats in the Park", venue: "Central Park, Nairobi", address: "Uhuru Highway, Nairobi",
    startsAt: "2026-12-19T14:00:00+03:00", endsAt: "2026-12-19T22:00:00+03:00", priceKes: 3000, capacity: 2000, available: 1420,
    status: "published", genre: "afrobeats", hue: 42,
    lineUp: [{ name: "Zawadi Waves", headliner: true }, { name: "Lagos to Luthuli" }, { name: "Sheng Soul" }, { name: "Mbogi Brass" }],
    description: "An all-day party with food stalls, a kids' corner until six, and the best of East and West African afrobeats.",
  },
  {
    id: 6, slug: "secret-rooftop-set", title: "Secret Rooftop Set", venue: "To be announced", address: "Nairobi",
    startsAt: "2026-12-31T21:00:00+03:00", endsAt: "2027-01-01T02:00:00+03:00", priceKes: 5000, capacity: 80, available: 80,
    status: "draft", genre: "house", hue: 300, lineUp: [],
    description: "Not announced yet.",
  },
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// Tests set this to 0 so they run fast; the dev server keeps the delay so you can see loading.tsx.
export const latency = { ms: process.env.NODE_ENV === "test" ? 0 : 400 };

// Published and cancelled events. Drafts are the organiser's secret until they're published.
export async function listEvents(): Promise<TikitiEvent[]> {
  await wait(latency.ms);
  return EVENTS.filter((e) => e.status !== "draft").map((e) => ({ ...e }));
}

export async function getEvent(id: number): Promise<TikitiEvent | null> {
  await wait(latency.ms);
  const event = EVENTS.find((e) => e.id === id && e.status !== "draft");
  return event ? { ...event } : null;
}

// Just the number that changes: cheap to ask for often.
export async function getSeats(id: number): Promise<number | null> {
  await wait(latency.ms / 4);
  return EVENTS.find((e) => e.id === id && e.status !== "draft")?.available ?? null;
}

// For the demo: other fans buying. Called by the seats route now and then.
export function someoneBought(id: number): void {
  const event = EVENTS.find((e) => e.id === id);
  if (event && event.status === "published" && event.available > 0 && Math.random() < 0.3) event.available -= 1;
}
