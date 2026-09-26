import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, count, eq, isNotNull, sum } from "drizzle-orm";
import { getViewer } from "../../../../server/viewer.ts";
import { getServer } from "../../../../server/context.ts";
import { findEvent } from "../../../../server/queries.ts";
import { orders, tickets } from "../../../../server/schema.ts";
import { can } from "../../../../server/policy.ts";
import { CheckIn } from "./CheckIn.tsx";

export const metadata: Metadata = { title: "Check-in" };

// Already written: the gate. Only the event's organiser (or an admin) gets this page; for anyone
// else it doesn't exist.
export default async function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=/events/${id}/check-in`);
  const event = /^[1-9]\d*$/.test(id) ? await findEvent(Number(id), viewer) : null;
  if (!event || !can(viewer, { do: "check-in", event })) notFound();

  const { database } = await getServer();
  const [{ sold }] = await database.db.select({ sold: sum(orders.quantity) }).from(orders).where(and(eq(orders.eventId, event.id), eq(orders.status, "paid")));
  const [{ inside }] = await database.db.select({ inside: count() }).from(tickets).where(and(eq(tickets.eventId, event.id), isNotNull(tickets.checkedInAt)));

  return (
    <section className="gate" aria-labelledby="gate-heading">
      <Link className="back-link" href={`/events/${event.id}`}>
        ← {event.title}
      </Link>
      <h1 id="gate-heading" className="page-title">
        Gate check-in
      </h1>
      <CheckIn eventId={event.id} sold={Number(sold ?? 0)} alreadyIn={inside} />
    </section>
  );
}
