import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findEvent } from "../../../server/queries.ts";
import { getViewer } from "../../../server/viewer.ts";
import { can } from "../../../server/policy.ts";
import { availability, formatKes, formatWhen } from "../../../lib/format.ts";
import { Poster } from "../../../components/Poster.tsx";
import { BuyForm } from "./BuyForm.tsx";

type Props = { params: Promise<{ id: string }> };

async function load(params: Props["params"]) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) return { event: null, viewer: null };
  const viewer = await getViewer();
  return { event: await findEvent(Number(id), viewer), viewer };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { event } = await load(params);
  return event ? { title: event.title, description: `${formatWhen(event.startsAt)} at ${event.venue}. From ${formatKes(event.priceKes)}.` } : { title: "Event not found" };
}

// Already written: one event. Your BuyForm does the buying.
export default async function EventPage({ params }: Props) {
  const { event, viewer } = await load(params);
  if (!event) notFound();
  const { tone, label } = availability(event);
  const onSale = can(viewer ?? { id: 0, role: "fan" }, { do: "buy-tickets", event, now: new Date() }) && event.available > 0;

  return (
    <article className="event-page">
      <Link className="back-link" href="/">
        ← All events
      </Link>
      <div className="event-hero event-hero-buy">
        <Poster event={event} large />
        <div className="buy-box">
          <h1>{event.title}</h1>
          <p className="event-hero-meta">
            <time dateTime={event.startsAt}>{formatWhen(event.startsAt)}</time>
            <span>{event.venue}</span>
          </p>
          <div className="buy-status">
            <span className="badge" data-tone={tone}>
              {label}
            </span>
            <span className="price">{formatKes(event.priceKes)} each</span>
          </div>
          {onSale ? (
            <BuyForm eventId={event.id} priceKes={event.priceKes} available={event.available} signedIn={viewer !== null} />
          ) : (
            <p className="sold-out-note">{event.status === "cancelled" ? "This event was cancelled." : "No tickets on sale right now."}</p>
          )}
          {can(viewer, { do: "check-in", event }) && (
            <p className="organiser-links">
              You run this event: <Link href={`/events/${event.id}/check-in`}>Check people in at the gate →</Link>
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
