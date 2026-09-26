import { asc, eq } from "drizzle-orm";
import { getServer } from "./context.ts";
import { events, orders, tickets, type EventRow } from "./schema.ts";
import { orderStatus, seatsTaken } from "./orders.ts";
import { ticketCode } from "./tickets.ts";
import { can } from "./policy.ts";
import type { SessionUser } from "./sessions.ts";

// What the pages show. Server components call these directly: no HTTP round trip to our own API,
// and the same rules (policy.ts, seatsTaken) the API uses, so the two can't disagree.
export type EventWithSeats = EventRow & { available: number };

async function withSeats(event: EventRow): Promise<EventWithSeats> {
  const { database, now } = await getServer();
  return { ...event, available: Math.max(0, event.capacity - (await seatsTaken(database.db, event.id, now()))) };
}

export async function listOnSale(): Promise<EventWithSeats[]> {
  const { database } = await getServer();
  const rows = await database.db.query.events.findMany({ where: eq(events.status, "published"), orderBy: asc(events.startsAt) });
  return Promise.all(rows.map(withSeats));
}

// An event the viewer is allowed to see (drafts only for their organiser), or null.
export async function findEvent(id: number, viewer: SessionUser | null): Promise<EventWithSeats | null> {
  const { database } = await getServer();
  const event = await database.db.query.events.findFirst({ where: eq(events.id, id) });
  if (!event || !can(viewer, { do: "see-event", event })) return null;
  return withSeats(event);
}

export interface OrderView {
  id: number;
  eventId: number;
  eventTitle: string;
  quantity: number;
  amountKes: number;
  status: ReturnType<typeof orderStatus>;
  problem: string | null;
  tickets: { id: number; code: string; checkedInAt: string | null }[];
}

// The viewer's own order (admins can see any), with ticket codes once it's paid. Anyone else: null.
export async function findOrder(id: number, viewer: SessionUser | null): Promise<OrderView | null> {
  const { database, ticketSecret, now } = await getServer();
  const order = await database.db.query.orders.findFirst({ where: eq(orders.id, id) });
  if (!order || !can(viewer, { do: "see-order", order })) return null;
  const event = await database.db.query.events.findFirst({ where: eq(events.id, order.eventId) });
  const issued = await database.db.query.tickets.findMany({ where: eq(tickets.orderId, order.id), orderBy: asc(tickets.id) });
  return {
    id: order.id,
    eventId: order.eventId,
    eventTitle: event?.title ?? "",
    quantity: order.quantity,
    amountKes: order.amountKes,
    status: orderStatus(order, now()),
    problem: order.problem,
    tickets: issued.map((t) => ({ id: t.id, code: ticketCode(t.id, ticketSecret), checkedInAt: t.checkedInAt })),
  };
}

export interface MyTicket {
  id: number;
  code: string;
  checkedInAt: string | null;
  event: Pick<EventRow, "id" | "title" | "venue" | "startsAt">;
}

// Every ticket the viewer holds, soonest event first.
export async function myTickets(viewer: SessionUser): Promise<MyTicket[]> {
  const { database, ticketSecret } = await getServer();
  const rows = await database.db
    .select({ id: tickets.id, checkedInAt: tickets.checkedInAt, eventId: events.id, title: events.title, venue: events.venue, startsAt: events.startsAt })
    .from(tickets)
    .innerJoin(events, eq(events.id, tickets.eventId))
    .where(eq(tickets.userId, viewer.id))
    .orderBy(asc(events.startsAt), asc(tickets.id));
  return rows.map((row) => ({
    id: row.id,
    code: ticketCode(row.id, ticketSecret),
    checkedInAt: row.checkedInAt,
    event: { id: row.eventId, title: row.title, venue: row.venue, startsAt: row.startsAt },
  }));
}
