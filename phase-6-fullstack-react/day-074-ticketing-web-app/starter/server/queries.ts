import { asc, eq } from "drizzle-orm";
// (asc, eq, events, orders, tickets, orderStatus, ticketCode and can are what you'll need below.)
import { getServer } from "./context.ts";
import { events, orders, tickets, type EventRow } from "./schema.ts";
import { orderStatus, seatsTaken } from "./orders.ts";
import { ticketCode } from "./tickets.ts";
import { can } from "./policy.ts";
import type { SessionUser } from "./sessions.ts";

// What the pages show. Server components call these directly: no HTTP round trip to our own API,
// and the same rules (policy.ts, seatsTaken) the API uses, so the two can't disagree.
export type EventWithSeats = EventRow & { available: number };

// Already written: an event with how many seats are left.
async function withSeats(event: EventRow): Promise<EventWithSeats> {
  const { database, now } = await getServer();
  return { ...event, available: Math.max(0, event.capacity - (await seatsTaken(database.db, event.id, now()))) };
}

export async function listOnSale(): Promise<EventWithSeats[]> {
  // TODO: the published events, soonest first, each with `available` (see withSeats).
  return [];
}

// An event the viewer is allowed to see (drafts only for their organiser), or null.
export async function findEvent(id: number, viewer: SessionUser | null): Promise<EventWithSeats | null> {
  // TODO: the event, if can(viewer, { do: "see-event", event }) says they may see it, with its seats. Otherwise null.
  void id;
  void viewer;
  return null;
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
  // TODO: the order, if can(viewer, { do: "see-order", order }). Otherwise null. With:
  // eventTitle (from its event), status: orderStatus(order, now()) (so a lapsed hold says "expired"),
  // and its tickets, oldest first, each with code: ticketCode(ticket.id, ticketSecret).
  void id;
  void viewer;
  return null;
}

export interface MyTicket {
  id: number;
  code: string;
  checkedInAt: string | null;
  event: Pick<EventRow, "id" | "title" | "venue" | "startsAt">;
}

// Every ticket the viewer holds, soonest event first.
export async function myTickets(viewer: SessionUser): Promise<MyTicket[]> {
  // TODO: every ticket the viewer holds (tickets.userId), joined to its event, soonest event first,
  // each with its code.
  void viewer;
  return [];
}

void [asc, eq, events, orders, tickets, orderStatus, ticketCode, can, withSeats];
