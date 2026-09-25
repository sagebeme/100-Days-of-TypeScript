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
    // TODO:
    // - The token in the path doesn't match options.callbackToken (compare with sameSecret): 404.
    // - Read the body with parseCallback (Day 52). It throws on anything that isn't a callback: 400.
    // - settlePayment, then answer { ResultCode: 0, ResultDesc: "Accepted", result: <the settlement's result> }.
    void [sameSecret, parseCallback, settlePayment];
    throw new Error("TODO: the M-Pesa callback");
  });

  // At the gate: scan the QR, and let them in once.
  app.post("/events/:id/check-in", requireUser, async (c) => {
    const event = await loadEvent(db, idParam(c));
    const staff = c.get("user");
    check(staff, { do: "check-in", event }, event);
    const { code } = await readBody(c, z.object({ code: z.string().max(100) }));
    // TODO:
    // - readTicketCode, then find the ticket. Either missing: 422 "Not a real ticket. Don't let them in."
    // - The ticket is for another event: 409 "This ticket is for a different event."
    // - Set checkedInAt and checkedInBy WHERE the id matches AND checkedInAt IS NULL (isNull), with
    //   .returning(). No row back means it was already used, maybe a moment ago at another gate:
    //   409 `Already used: this ticket got in at ${nairobiTime(<when it got in>)}.`
    // - Otherwise { admitted: true, ticketId, holder: <the ticket owner's name>, checkedInAt }.
    void [code, staff, readTicketCode, isNull, users, nairobiTime];
    throw new Error("TODO: check in");
  });

  // For the organiser: how's it selling, and how many are in?
  app.get("/events/:id/sales", requireUser, async (c) => {
    const event = await loadEvent(db, idParam(c));
    check(c.get("user"), { do: "see-sales", event }, event);
    // TODO: { capacity, sold, held, available, revenueKes, checkedIn }
    // - sold and revenueKes: sum of quantity and amountKes over this event's PAID orders (Number(), since sum can be null)
    // - held: seats taken (seatsTaken) that aren't sold yet; available: capacity - seats taken
    // - checkedIn: count of this event's tickets with checkedInAt set (isNotNull)
    void [and, count, isNotNull, sum, seatsTaken];
    throw new Error("TODO: sales");
  });

  app.onError(onError);
  return app;
}
