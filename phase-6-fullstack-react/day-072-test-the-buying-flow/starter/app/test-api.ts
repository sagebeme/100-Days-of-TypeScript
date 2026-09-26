import type { Plugin } from "vite";

// Already written: the ticketing API, as a test double. Unlike Day 70's busy pretend API, nothing
// here is random: seats only change when a test says so, and a payment only settles when a test
// says so. End-to-end tests must be able to say exactly what the world looks like.
//
// Control endpoints, for tests only:
//   POST /__test/reset                         back to the three events below, no orders
//   POST /__test/seats  { eventId, available } other fans bought (or returned) tickets
//   POST /__test/orders/:id/settle { outcome } "paid" or "cancelled": what M-Pesa says
//   POST /__test/fail-next { status }          the next API request fails with this status
interface Event {
  id: number;
  title: string;
  venue: string;
  startsAt: string;
  priceKes: number;
  capacity: number;
  available: number;
  status: "published" | "cancelled";
  genre: string;
  hue: number;
}

const FIXTURES: readonly Event[] = [
  { id: 1, title: "Jioni Jazz Night", venue: "Uhuru Gardens", startsAt: "2026-12-12T18:00:00+03:00", priceKes: 2500, capacity: 500, available: 212, status: "published", genre: "jazz", hue: 265 },
  { id: 2, title: "Gengetone Block Party", venue: "Kasarani Annex", startsAt: "2026-12-05T15:00:00+03:00", priceKes: 800, capacity: 1200, available: 14, status: "published", genre: "gengetone", hue: 18 },
  { id: 3, title: "Laugh Industry Live", venue: "Alliance Française Garden", startsAt: "2026-12-10T19:30:00+03:00", priceKes: 1000, capacity: 250, available: 180, status: "cancelled", genre: "comedy", hue: 330 },
];
interface Order {
  id: number;
  eventId: number;
  quantity: number;
  amountKes: number;
  status: "pending" | "paid" | "cancelled";
  problem: string | null;
  tickets: { id: number; code: string }[];
}

export function testTicketingApi(): Plugin {
  let events: Event[] = [];
  let orders = new Map<number, Order>();
  let nextTicket = 1;
  let failNext: number | null = null;
  const reset = () => {
    events = FIXTURES.map((e) => ({ ...e }));
    orders = new Map();
    nextTicket = 1;
    failNext = null;
  };
  reset();

  return {
    name: "test-ticketing-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        if (!url.pathname.startsWith("/api/") && !url.pathname.startsWith("/__test/")) return next();
        const send = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(body));
        };
        let raw = "";
        for await (const chunk of req) raw += chunk;
        const body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        let match;

        // --- controls ---
        if (url.pathname === "/__test/reset") return reset(), send(204, null);
        if (url.pathname === "/__test/seats") {
          const event = events.find((e) => e.id === body.eventId);
          if (event) event.available = Number(body.available);
          return send(204, null);
        }
        if ((match = /^\/__test\/orders\/(\d+)\/settle$/.exec(url.pathname))) {
          const order = orders.get(Number(match[1]));
          if (!order) return send(404, { error: "No such order" });
          if (body.outcome === "paid") {
            order.status = "paid";
            order.tickets = Array.from({ length: order.quantity }, () => {
              const id = nextTicket++;
              return { id, code: `T${id}-${String(id).padStart(16, "A")}` };
            });
          } else {
            order.status = "cancelled";
            order.problem = "You cancelled the payment on your phone.";
            const event = events.find((e) => e.id === order.eventId);
            if (event) event.available += order.quantity;
          }
          return send(204, null);
        }
        if (url.pathname === "/__test/fail-next") return (failNext = Number(body.status)), send(204, null);

        // --- the API ---
        if (failNext !== null) {
          const status = failNext;
          failNext = null;
          return send(status, { error: "The server is busy. Trying again usually works." });
        }
        if (url.pathname === "/api/events") return send(200, { events });
        if ((match = /^\/api\/events\/(\d+)$/.exec(url.pathname))) {
          const event = events.find((e) => e.id === Number(match![1]));
          return event ? send(200, event) : send(404, { error: "No such event" });
        }
        if ((match = /^\/api\/events\/(\d+)\/orders$/.exec(url.pathname)) && req.method === "POST") {
          const event = events.find((e) => e.id === Number(match![1]));
          if (!event) return send(404, { error: "No such event" });
          const quantity = Number(body.quantity);
          if (!/^(0|\+?254)[17]\d{8}$/.test(String(body.phone ?? "").replace(/[\s-]/g, ""))) {
            return send(422, { error: "Enter a Safaricom number like 0712 345 678" });
          }
          if (quantity > event.available) return send(409, { error: event.available === 0 ? "Sold out" : `Only ${event.available} left` });
          event.available -= quantity;
          const order: Order = { id: orders.size + 1, eventId: event.id, quantity, amountKes: quantity * event.priceKes, status: "pending", problem: null, tickets: [] };
          orders.set(order.id, order);
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
