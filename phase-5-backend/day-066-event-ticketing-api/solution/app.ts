import { Hono } from "hono";
import { createHash, timingSafeEqual } from "node:crypto";
import { and, asc, count, eq, isNotNull, isNull, sum } from "drizzle-orm";
import { z } from "zod";
import { orders, tickets, users } from "./schema.ts";
import { currentUser, requireUser, type Env } from "./guards.ts";
import { readBody, idParam, fail, onError } from "./http.ts";
import { authRoutes } from "./auth.ts";
import { eventRoutes, loadEvent, check } from "./events.ts";
import { can } from "./policy.ts";
import { placeOrder, paymentStarted, paymentDidNotStart, settlePayment, seatsTaken, orderStatus, SoldOut } from "./orders.ts";
import { ticketCode, readTicketCode } from "./tickets.ts";
import { parseCallback } from "./callback.ts";
import { darajaPhone } from "./daraja.ts";
import type { Database } from "./db.ts";
import type { Payments } from "./payments.ts";
import type { OrderRow } from "./schema.ts";

export interface AppOptions {
  database: Database;
  payments: Payments;
  ticketSecret: string; // signs ticket codes: anyone with it can make tickets
  callbackToken: string; // part of the callback URL, so strangers can't post fake payments
  now?: () => Date;
  secureCookies?: boolean;
}

const OrderSchema = z.object({
  quantity: z.number().int().min(1, "Buy at least 1 ticket").max(10, "At most 10 tickets per order"),
  phone: z.string().transform((phone, ctx) => darajaPhone(phone) ?? (ctx.addIssue({ code: "custom", message: "Enter a Safaricom number like 0712 345 678" }), z.NEVER)),
});

// Compares secrets in constant time. Hashing first makes both sides the same length.
function sameSecret(a: string, b: string): boolean {
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(a), digest(b));
}

// "2026-12-12T16:02:00.000Z" -> "19:02", the time on the gate staff's watches.
const nairobiTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { timeZone: "Africa/Nairobi", hour: "2-digit", minute: "2-digit" });

export function createApp(options: AppOptions) {
  const { database, payments, ticketSecret } = options;
  const { db } = database;
  const now = options.now ?? (() => new Date());

  const app = new Hono<Env>().use(currentUser(db, now));
  app.route("/", authRoutes({ db, now, secureCookies: options.secureCookies ?? true }));
  app.route("/", eventRoutes({ db, now }));

  async function orderView(order: OrderRow) {
    const issued = order.status === "paid" ? await db.query.tickets.findMany({ where: eq(tickets.orderId, order.id), orderBy: asc(tickets.id) }) : [];
    return {
      id: order.id,
      eventId: order.eventId,
      quantity: order.quantity,
      amountKes: order.amountKes,
      status: orderStatus(order, now()),
      holdExpiresAt: order.holdExpiresAt,
      receipt: order.receipt,
      problem: order.problem,
      tickets: issued.map((t) => ({ id: t.id, code: ticketCode(t.id, ticketSecret), checkedInAt: t.checkedInAt })),
    };
  }

  // Buy: hold the seats, then ask M-Pesa to prompt the phone. The answer comes to the callback.
  app.post("/events/:id/orders", requireUser, async (c) => {
    const event = await loadEvent(db, idParam(c));
    const user = c.get("user");
    check(user, { do: "see-event", event }, event);
    if (!can(user, { do: "buy-tickets", event, now: now() })) {
      fail(409, event.status === "cancelled" ? "This event was cancelled" : "Tickets aren't on sale: the event has already started");
    }
    const input = await readBody(c, OrderSchema);

    let order: OrderRow;
    try {
      order = await placeOrder(database, { event, userId: user.id, quantity: input.quantity, phone: input.phone, now: now() });
    } catch (error) {
      if (error instanceof SoldOut) fail(409, error.available === 0 ? "Sold out" : `Only ${error.available} left`);
      throw error;
    }

    // The network call happens OUTSIDE the transaction: never hold the database while waiting on someone else's server.
    try {
      const started = await payments.start({ phone: input.phone, amount: order.amountKes, reference: `ORDER-${order.id}`, description: "Event tickets" });
      await paymentStarted(db, order.id, started.checkoutRequestId);
    } catch {
      await paymentDidNotStart(db, order.id, "M-Pesa didn't answer, so no money was taken");
      fail(502, "M-Pesa didn't answer, so no money was taken. Try again in a minute.");
    }
    const saved = await db.query.orders.findFirst({ where: eq(orders.id, order.id) });
    return c.json({ order: await orderView(saved!), message: "Check your phone and enter your M-Pesa PIN" }, 201);
  });

  // Someone else's order is a 404, not a 403: order ids shouldn't confirm what exists.
  app.get("/orders/:id", requireUser, async (c) => {
    const order = await db.query.orders.findFirst({ where: eq(orders.id, idParam(c)) });
    if (!order || !can(c.get("user"), { do: "see-order", order })) fail(404, "No such order");
    return c.json({ order: await orderView(order) });
  });

  // Safaricom calls this. It can't log in, so the secret is in the path. Always answer 200 once the
  // body is understood: Daraja treats anything else as "not delivered" and may try again.
  app.post("/payments/mpesa/:token", async (c) => {
    if (!sameSecret(c.req.param("token"), options.callbackToken)) fail(404, "Not found");
    let outcome;
    try {
      outcome = parseCallback(await c.req.json());
    } catch {
      fail(400, "That isn't an M-Pesa callback");
    }
    const settled = await settlePayment(database, outcome, now());
    return c.json({ ResultCode: 0, ResultDesc: "Accepted", result: settled.result });
  });

  // At the gate: scan the QR, and let them in once.
  app.post("/events/:id/check-in", requireUser, async (c) => {
    const event = await loadEvent(db, idParam(c));
    const staff = c.get("user");
    check(staff, { do: "check-in", event }, event);
    const { code } = await readBody(c, z.object({ code: z.string().max(100) }));

    const ticketId = readTicketCode(code, ticketSecret);
    const ticket = ticketId === null ? undefined : await db.query.tickets.findFirst({ where: eq(tickets.id, ticketId) });
    if (!ticket) fail(422, "Not a real ticket. Don't let them in.");
    if (ticket.eventId !== event.id) fail(409, "This ticket is for a different event.");

    // "WHERE checked_in_at IS NULL" makes the check and the update one step, so the same ticket
    // shown at two gates at once only gets in at one of them.
    const at = now().toISOString();
    const [admitted] = await db
      .update(tickets)
      .set({ checkedInAt: at, checkedInBy: staff.id })
      .where(and(eq(tickets.id, ticket.id), isNull(tickets.checkedInAt)))
      .returning();
    if (!admitted) {
      const used = await db.query.tickets.findFirst({ where: eq(tickets.id, ticket.id) });
      fail(409, `Already used: this ticket got in at ${nairobiTime(used!.checkedInAt!)}.`);
    }
    const holder = await db.query.users.findFirst({ where: eq(users.id, ticket.userId) });
    return c.json({ admitted: true, ticketId: ticket.id, holder: holder?.name, checkedInAt: at });
  });

  // For the organiser: how's it selling, and how many are in?
  app.get("/events/:id/sales", requireUser, async (c) => {
    const event = await loadEvent(db, idParam(c));
    check(c.get("user"), { do: "see-sales", event }, event);
    const [paid] = await db
      .select({ sold: sum(orders.quantity), revenueKes: sum(orders.amountKes) })
      .from(orders)
      .where(and(eq(orders.eventId, event.id), eq(orders.status, "paid")));
    const [inside] = await db
      .select({ checkedIn: count() })
      .from(tickets)
      .where(and(eq(tickets.eventId, event.id), isNotNull(tickets.checkedInAt)));
    const sold = Number(paid.sold ?? 0);
    const taken = await seatsTaken(db, event.id, now());
    return c.json({
      capacity: event.capacity,
      sold,
      held: taken - sold,
      available: event.capacity - taken,
      revenueKes: Number(paid.revenueKes ?? 0),
      checkedIn: inside.checkedIn,
    });
  });

  app.onError(onError);
  return app;
}
