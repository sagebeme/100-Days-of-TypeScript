import type { Plugin } from "vite";

// Already written: a pretend ticketing API inside the Vite dev server, that behaves like a busy one:
// - other fans keep buying, so seat counts drop by themselves every few seconds
// - an order is "paid" about 6 seconds after it's placed (the time it takes to type a PIN)
// - the phone number 0700 000 000 cancels the payment instead
// - one request in eight fails with a 503, so you can watch the app recover
const events = [
  { id: 1, title: "Jioni Jazz Night", venue: "Uhuru Gardens", startsAt: "2026-12-12T18:00:00+03:00", priceKes: 2500, capacity: 500, available: 212, status: "published", genre: "jazz", hue: 265 },
  { id: 2, title: "Gengetone Block Party", venue: "Kasarani Annex", startsAt: "2026-12-05T15:00:00+03:00", priceKes: 800, capacity: 1200, available: 24, status: "published", genre: "gengetone", hue: 18 },
  { id: 3, title: "Benga Sundowner", venue: "Karura Forest Glade", startsAt: "2026-12-06T16:30:00+03:00", priceKes: 1500, capacity: 300, available: 6, status: "published", genre: "benga", hue: 150 },
  { id: 4, title: "Rhumba Mondays", venue: "Mama Njeri's Rooftop", startsAt: "2026-12-07T20:00:00+03:00", priceKes: 600, capacity: 120, available: 95, status: "published", genre: "rhumba", hue: 200 },
  { id: 5, title: "Afrobeats in the Park", venue: "Central Park, Nairobi", startsAt: "2026-12-19T14:00:00+03:00", priceKes: 3000, capacity: 2000, available: 1420, status: "published", genre: "afrobeats", hue: 42 },
  { id: 6, title: "Laugh Industry Live", venue: "Alliance Française Garden", startsAt: "2026-12-10T19:30:00+03:00", priceKes: 1000, capacity: 250, available: 180, status: "cancelled", genre: "comedy", hue: 330 },
];

interface FakeOrder {
  id: number;
  eventId: number;
  quantity: number;
  amountKes: number;
  status: "pending" | "paid" | "cancelled";
  problem: string | null;
  tickets: { id: number; code: string }[];
}
const orders = new Map<number, FakeOrder>();
let nextTicket = 1;

setInterval(() => {
  const event = events[Math.floor(Math.random() * events.length)];
  if (event.status === "published") event.available = Math.max(0, event.available - Math.ceil(Math.random() * 3));
}, 4000).unref();

export function fakeTicketingApi(): Plugin {
  return {
    name: "fake-ticketing-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();
        const send = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(body));
        };
        await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500));
        if (req.method === "GET" && Math.random() < 1 / 8) return send(503, { error: "The server is busy. Trying again usually works." });

        const url = new URL(req.url, "http://localhost");
        let match;
        if (url.pathname === "/api/events") return send(200, { events });
        if ((match = /^\/api\/events\/(\d+)$/.exec(url.pathname))) {
          const event = events.find((e) => e.id === Number(match![1]));
          return event ? send(200, event) : send(404, { error: "No such event" });
        }
        if ((match = /^\/api\/events\/(\d+)\/orders$/.exec(url.pathname)) && req.method === "POST") {
          const event = events.find((e) => e.id === Number(match![1]));
          if (!event) return send(404, { error: "No such event" });
          let raw = "";
          for await (const chunk of req) raw += chunk;
          const { quantity, phone } = JSON.parse(raw || "{}") as { quantity: number; phone: string };
          const digits = String(phone ?? "").replace(/\D/g, "");
          if (!/^(0|254)[17]\d{8}$/.test(digits)) return send(422, { error: "Enter a Safaricom number like 0712 345 678" });
          if (quantity > event.available) return send(409, { error: event.available === 0 ? "Sold out" : `Only ${event.available} left` });
          event.available -= quantity;
          const order: FakeOrder = { id: orders.size + 1, eventId: event.id, quantity, amountKes: quantity * event.priceKes, status: "pending", problem: null, tickets: [] };
          orders.set(order.id, order);
          setTimeout(() => {
            if (digits.endsWith("700000000")) {
              order.status = "cancelled";
              order.problem = "You cancelled the payment on your phone.";
              event.available += quantity;
            } else {
              order.status = "paid";
              order.tickets = Array.from({ length: quantity }, () => {
                const id = nextTicket++;
                return { id, code: `T${id}-${Math.random().toString(16).slice(2, 18).toUpperCase().padEnd(16, "0")}` };
              });
            }
          }, 6000);
          return send(201, { order });
        }
        if ((match = /^\/api\/orders\/(\d+)$/.exec(url.pathname))) {
          const order = orders.get(Number(match[1]));
          return order ? send(200, { order }) : send(404, { error: "No such order" });
        }
        send(404, { error: "Not found" });
      });
    },
  };
}
