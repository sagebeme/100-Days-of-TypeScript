import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "../../server/viewer.ts";
import { myTickets } from "../../server/queries.ts";
import { formatWhen } from "../../lib/format.ts";

export const metadata: Metadata = { title: "My tickets" };

// Already written: every ticket you hold, grouped by event.
export default async function TicketsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/tickets");
  const tickets = await myTickets(viewer);
  const byEvent = new Map<number, typeof tickets>();
  for (const ticket of tickets) byEvent.set(ticket.event.id, [...(byEvent.get(ticket.event.id) ?? []), ticket]);

  return (
    <section className="section" aria-labelledby="my-tickets">
      <div className="section-head">
        <h1 id="my-tickets" className="page-title">
          My tickets
        </h1>
      </div>
      {byEvent.size === 0 ? (
        <p className="empty">
          No tickets yet. <Link href="/">See what's on</Link>
        </p>
      ) : (
        [...byEvent.values()].map((group) => (
          <article key={group[0].event.id} className="ticket-group" aria-labelledby={`tickets-${group[0].event.id}`}>
            <h2 id={`tickets-${group[0].event.id}`}>{group[0].event.title}</h2>
            <p className="muted">
              {formatWhen(group[0].event.startsAt)} · {group[0].event.venue}
            </p>
            <ul className="ticket-codes">
              {group.map((ticket) => (
                <li key={ticket.id} data-used={ticket.checkedInAt ? "" : undefined}>
                  <code>{ticket.code}</code>
                  {ticket.checkedInAt && <span className="muted"> · used</span>}
                </li>
              ))}
            </ul>
          </article>
        ))
      )}
    </section>
  );
}
