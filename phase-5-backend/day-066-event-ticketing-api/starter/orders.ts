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
  // TODO: add up orders.quantity (sum) for this event's orders that are paid, or pending with
  // holdExpiresAt still after now. Leave out exceptOrderId when it's given (ne). No rows: 0.
  void [and, eq, gt, ne, or, sum, orders, db, eventId, now, exceptOrderId];
  throw new Error("TODO: seatsTaken");
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
    // TODO: how many seats are left? If fewer than input.quantity, throw new SoldOut(left) (never below 0).
    // Otherwise insert the order: amountKes is quantity x price, and the hold runs HOLD_MINUTES from now.
    void input;
    throw new Error("TODO: placeOrder");
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
    // TODO, in this order:
    // 1. Find the order by outcome.checkoutRequestId. None: { result: "unknown-payment" }.
    // 2. Not pending any more: it's a repeat. { result: "already-settled", order }, and change nothing.
    // 3. Cancelled or failed: set status to outcome.status and problem to outcome.reason. "not-paid".
    // 4. Paid, from here. The money's been taken, so nothing is simply ignored: it's tickets or a refund.
    //    Always save receipt and paidAt.
    //    - The wrong amount: status "failed", problem "Paid KES <paid> but the order was KES <price>: refund needed (receipt <receipt>)".
    //    - The hold ran out (holdExpiresAt <= now): is there room for it, leaving this order out of the count?
    //      If not: status "failed", problem with "refund needed" in it. Both are { result: "refund-needed", order }.
    // 5. Otherwise: status "paid", insert one ticket per seat, and return { result: "paid", order, ticketIds }.
    void [db, outcome, now, events, tickets];
    throw new Error("TODO: settlePayment");
  });
}

// What the fan sees. A pending order whose hold has run out has expired: the seats went back.
export function orderStatus(order: OrderRow, now: Date): OrderRow["status"] | "expired" {
  return order.status === "pending" && order.holdExpiresAt <= now.toISOString() ? "expired" : order.status;
}
