// Already written: the shape of a season's data, and a generator for made-up seasons of any size.
// The same seed always gives the same season, so timings and outputs can be compared.

export interface User {
  id: number;
  name: string;
}

export interface TikitiEvent {
  id: number;
  title: string;
  startsAt: string;
  capacity: number;
  priceKes: number;
}

export interface Order {
  id: number;
  eventId: number;
  userId: number;
  quantity: number;
  amountKes: number;
  status: "paid" | "failed" | "cancelled";
  createdAt: string; // ISO, UTC
}

export interface Ticket {
  id: number;
  orderId: number;
  checkedInAt: string | null;
}

export interface Season {
  users: User[];
  events: TikitiEvent[];
  orders: Order[];
  tickets: Ticket[];
}

function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Amina", "Brian", "Chebet", "Daudi", "Esther", "Faith", "Gitau", "Halima", "Imani", "Juma", "Kerubo", "Lemayian", "Makena", "Njeri", "Otieno", "Pendo", "Rehema", "Sifa", "Tumaini", "Wanjiru"];
const LAST = ["K.", "M.", "O.", "W.", "N.", "A.", "C.", "J."];
const KINDS = ["Jazz Night", "Comedy Store", "Benga Revival", "Afrobeats Party", "Poetry Slam", "Gospel Fest", "Film Screening", "Food Market"];
const PLACES = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Kilifi", "Nanyuki", "Naivasha"];

export function makeSeason(seed: number, sizes = { users: 3000, events: 150, orders: 8000 }): Season {
  const rand = random(seed);
  const pick = <T>(list: T[]) => list[Math.floor(rand() * list.length)];
  const start = Date.parse("2026-01-01T00:00:00Z");
  const year = 365 * 24 * 3600_000;

  const users = Array.from({ length: sizes.users }, (_, i) => ({ id: i + 1, name: `${pick(FIRST)} ${pick(LAST)}` }));
  const events = Array.from({ length: sizes.events }, (_, i) => ({
    id: i + 1,
    title: `${pick(PLACES)} ${pick(KINDS)} ${i + 1}`,
    startsAt: new Date(start + rand() * year).toISOString(),
    capacity: 50 + Math.floor(rand() * 950),
    priceKes: 500 + Math.floor(rand() * 30) * 100,
  }));
  const orders: Order[] = [];
  const tickets: Ticket[] = [];
  for (let i = 0; i < sizes.orders; i++) {
    const event = pick(events);
    const quantity = 1 + Math.floor(rand() * rand() * 6);
    const roll = rand();
    const status = roll < 0.82 ? "paid" : roll < 0.93 ? "failed" : "cancelled";
    const eventTime = Date.parse(event.startsAt);
    const createdAt = new Date(eventTime - rand() * 60 * 24 * 3600_000).toISOString();
    // Popular fans buy again and again: a quarter of the orders come from the first 5% of users.
    const userId = rand() < 0.25 ? 1 + Math.floor(rand() * Math.max(1, sizes.users * 0.05)) : 1 + Math.floor(rand() * sizes.users);
    const order: Order = { id: i + 1, eventId: event.id, userId, quantity, amountKes: quantity * event.priceKes, status, createdAt };
    orders.push(order);
    if (status === "paid") {
      for (let q = 0; q < quantity; q++) {
        const showedUp = rand() < 0.87;
        tickets.push({ id: tickets.length + 1, orderId: order.id, checkedInAt: showedUp ? new Date(eventTime + rand() * 3 * 3600_000).toISOString() : null });
      }
    }
  }
  // The database hands tickets back in no particular order.
  for (let i = tickets.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [tickets[i], tickets[j]] = [tickets[j], tickets[i]];
  }
  return { users, events, orders, tickets };
}
