import { and, eq, gt, ne, or, sum } from "drizzle-orm";
import { events, orders, tickets, type EventRow, type OrderRow } from "./schema.ts";
import type { Database, Db } from "./db.ts";
import type { PaymentOutcome } from "./callback.ts";

// How long seats are held for someone while they find their phone and enter their PIN.
export const HOLD_MINUTES = 10;

export class SoldOut extends Error {
  readonly available: number;
  constructor(available: number) {
    super(available === 0 ? "Sold out" : `Only ${available} left`);
    this.available = available;
  }
}

// Seats that are gone: paid for, or held by someone who's paying right now.
// A hold that has run out doesn't count, so seats come back without anyone cleaning up.
// exceptOrderId leaves one order out: "is there room for this order if it weren't here?"
export async function seatsTaken(db: Db, eventId: number, now: Date, exceptOrderId = 0): Promise<number> {
  const [row] = await db
    .select({ taken: sum(orders.quantity) })
    .from(orders)
    .where(
      and(
        eq(orders.eventId, eventId),
        or(eq(orders.status, "paid"), and(eq(orders.status, "pending"), gt(orders.holdExpiresAt, now.toISOString()))),
        exceptOrderId ? ne(orders.id, exceptOrderId) : undefined,
      ),
    );
  return Number(row?.taken ?? 0);
}

export interface NewOrder {
  event: EventRow;
  userId: number;
  quantity: number;
  phone: string;
  now: Date;
}

// Holds the seats. The check and the insert are in ONE transaction, so two fans buying the last
// seat at the same moment can't both get it: the second one sees the first one's hold.
export function placeOrder(database: Database, input: NewOrder): Promise<OrderRow> {
  return database.transaction(async () => {
    const available = input.event.capacity - (await seatsTaken(database.db, input.event.id, input.now));
    if (input.quantity > available) throw new SoldOut(Math.max(available, 0));
    const [order] = await database.db
      .insert(orders)
      .values({
        eventId: input.event.id,
        userId: input.userId,
        quantity: input.quantity,
        amountKes: input.quantity * input.event.priceKes,
        phone: input.phone,
        holdExpiresAt: new Date(input.now.getTime() + HOLD_MINUTES * 60_000).toISOString(),
        createdAt: input.now.toISOString(),
      })
      .returning();
    return order;
  });
}

export async function paymentStarted(db: Db, orderId: number, checkoutRequestId: string): Promise<void> {
  await db.update(orders).set({ checkoutRequestId }).where(eq(orders.id, orderId));
}

export async function paymentDidNotStart(db: Db, orderId: number, problem: string): Promise<void> {
  await db.update(orders).set({ status: "failed", problem }).where(eq(orders.id, orderId));
}

export type Settlement =
  | { result: "paid"; order: OrderRow; ticketIds: number[] }
  | { result: "not-paid"; order: OrderRow }
  | { result: "refund-needed"; order: OrderRow }
  | { result: "already-settled"; order: OrderRow }
  | { result: "unknown-payment" };

// What to do when M-Pesa tells us how a payment went. Safaricom can send the same callback more
// than once, and can send it late, so this has to be safe to run again, and at any time.
export function settlePayment(database: Database, outcome: PaymentOutcome, now: Date): Promise<Settlement> {
  const { db } = database;
  return database.transaction(async () => {
    const order = await db.query.orders.findFirst({ where: eq(orders.checkoutRequestId, outcome.checkoutRequestId) });
    if (!order) return { result: "unknown-payment" } as const;
    // Already dealt with: a repeat of a callback we've handled changes nothing.
    if (order.status !== "pending") return { result: "already-settled", order } as const;

    const update = async (changes: Partial<OrderRow>) => {
      const [updated] = await db.update(orders).set(changes).where(eq(orders.id, order.id)).returning();
      return updated;
    };

    if (outcome.status !== "paid") {
      return { result: "not-paid", order: await update({ status: outcome.status, problem: outcome.reason }) } as const;
    }

    const paid = { receipt: outcome.receipt, paidAt: outcome.paidAt };
    // The money's been taken, so from here on nothing is simply ignored: it's tickets, or a refund.
    if (outcome.amount !== order.amountKes) {
      const problem = `Paid KES ${outcome.amount} but the order was KES ${order.amountKes}: refund needed (receipt ${outcome.receipt})`;
      return { result: "refund-needed", order: await update({ ...paid, status: "failed", problem }) } as const;
    }
    if (order.holdExpiresAt <= now.toISOString()) {
      // They paid after the hold ran out. Honour it if the seats are still there.
      const event = await db.query.events.findFirst({ where: eq(events.id, order.eventId) });
      const available = (event?.capacity ?? 0) - (await seatsTaken(db, order.eventId, now, order.id));
      if (order.quantity > available) {
        const problem = `Paid after the ${HOLD_MINUTES}-minute hold ran out, and the seats were sold: refund needed (receipt ${outcome.receipt})`;
        return { result: "refund-needed", order: await update({ ...paid, status: "failed", problem }) } as const;
      }
    }

    const updated = await update({ ...paid, status: "paid" });
    const issued = await db
      .insert(tickets)
      .values(Array.from({ length: order.quantity }, () => ({ orderId: order.id, eventId: order.eventId, userId: order.userId })))
      .returning({ id: tickets.id });
    return { result: "paid", order: updated, ticketIds: issued.map((t) => t.id) } as const;
  });
}

// What the fan sees. A pending order whose hold has run out has expired: the seats went back.
export function orderStatus(order: OrderRow, now: Date): OrderRow["status"] | "expired" {
  return order.status === "pending" && order.holdExpiresAt <= now.toISOString() ? "expired" : order.status;
}
