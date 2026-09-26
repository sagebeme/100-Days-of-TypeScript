// Already written: the ticketing data the agent works with. In Day 80 this is the real API; here
// it's in memory, so the tests are fast and nothing is really sold.
export interface StoreEvent {
  id: number;
  title: string;
  venue: string;
  startsAt: string;
  priceKes: number;
  available: number;
  genre: string;
  status: "published" | "cancelled";
}

export interface Quote {
  id: string; // "Q1"
  eventId: number;
  quantity: number;
  totalKes: number;
  turn: number; // which turn of the conversation it was made in
  expiresAt: number;
}

export interface Order {
  id: number;
  eventId: number;
  quantity: number;
  totalKes: number;
  phone: string;
}

export const EVENTS: StoreEvent[] = [
  { id: 1, title: "Jioni Jazz Night", venue: "Uhuru Gardens", startsAt: "2026-12-12T18:00:00+03:00", priceKes: 2500, available: 212, genre: "jazz", status: "published" },
  { id: 2, title: "Gengetone Block Party", venue: "Kasarani Annex", startsAt: "2026-12-05T15:00:00+03:00", priceKes: 800, available: 14, genre: "gengetone", status: "published" },
  { id: 3, title: "Benga Sundowner", venue: "Karura Forest Glade", startsAt: "2026-12-06T16:30:00+03:00", priceKes: 1500, available: 0, genre: "benga", status: "published" },
  { id: 4, title: "Laugh Industry Live", venue: "Alliance Française Garden", startsAt: "2026-12-10T19:30:00+03:00", priceKes: 1000, available: 180, genre: "comedy", status: "cancelled" },
  { id: 5, title: "Afrobeats in the Park", venue: "Central Park, Nairobi", startsAt: "2026-12-19T14:00:00+03:00", priceKes: 3000, available: 1420, genre: "afrobeats", status: "published" },
];

const QUOTE_MINUTES = 10;

export function createStore(events: StoreEvent[] = EVENTS) {
  const data = events.map((e) => ({ ...e }));
  const quotes = new Map<string, Quote>();
  const orders: Order[] = [];

  const find = (id: number) => {
    const event = data.find((e) => e.id === id);
    if (!event) throw new Error(`There's no event ${id}`);
    return event;
  };

  return {
    orders,

    // Published events, soonest first, matching every filter given.
    search(filters: { text?: string; genre?: string; from?: string; to?: string }): StoreEvent[] {
      const text = filters.text?.toLowerCase();
      return data
        .filter((e) => e.status === "published")
        .filter((e) => !text || `${e.title} ${e.venue} ${e.genre}`.toLowerCase().includes(text))
        .filter((e) => !filters.genre || e.genre === filters.genre)
        .filter((e) => !filters.from || new Date(e.startsAt) >= new Date(filters.from))
        .filter((e) => !filters.to || new Date(e.startsAt) <= new Date(filters.to))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    },

    get: (id: number): StoreEvent => ({ ...find(id) }),

    quote(eventId: number, quantity: number, turn: number, now: Date): Quote {
      const event = find(eventId);
      if (event.status !== "published") throw new Error(`${event.title} was cancelled`);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) throw new Error("Between 1 and 10 tickets per order");
      if (quantity > event.available) throw new Error(event.available === 0 ? `${event.title} is sold out` : `Only ${event.available} left`);
      const quote: Quote = { id: `Q${quotes.size + 1}`, eventId, quantity, totalKes: quantity * event.priceKes, turn, expiresAt: now.getTime() + QUOTE_MINUTES * 60_000 };
      quotes.set(quote.id, quote);
      return quote;
    },

    findQuote: (id: string): Quote | undefined => quotes.get(id),

    // Holds the seats and sends the M-Pesa prompt (pretend).
    buy(quote: Quote, phone: string): Order {
      const digits = phone.replace(/[\s-]/g, "");
      const match = /^(?:\+?254|0)([17]\d{8})$/.exec(digits);
      if (!match) throw new Error("That isn't a Safaricom number. It should look like 0712 345 678");
      const event = find(quote.eventId);
      if (quote.quantity > event.available) throw new Error(`Only ${event.available} left now`);
      event.available -= quote.quantity;
      quotes.delete(quote.id);
      const order: Order = { id: orders.length + 1, eventId: event.id, quantity: quote.quantity, totalKes: quote.totalKes, phone: `254${match[1]}` };
      orders.push(order);
      return order;
    },
  };
}

export type Store = ReturnType<typeof createStore>;
