import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getEvent, listEvents, type TikitiEvent } from "../../../lib/events.ts";
import { formatKes, formatWhen } from "../../../lib/format.ts";
import { Poster } from "../../../components/Poster.tsx";
import { LiveSeats } from "./LiveSeats.tsx";
import { MoreEvents, MoreEventsSkeleton } from "./MoreEvents.tsx";

type Props = { params: Promise<{ id: string }> };

// "/events/abc", "/events/0" and "/events/1.5" aren't events.
async function load(params: Props["params"]): Promise<TikitiEvent | null> {
  const { id } = await params;
  return /^[1-9]\d*$/.test(id) ? getEvent(Number(id)) : null;
}

// Build a page for every event ahead of time, so the first visitor gets it as fast as the hundredth.
// Events added later are built the first time someone asks for them.
export async function generateStaticParams(): Promise<{ id: string }[]> {
  return (await listEvents()).filter((e) => e.status === "published").map((e) => ({ id: String(e.id) }));
}

// What search engines and WhatsApp link previews show. Next deduplicates the two getEvent calls.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await load(params);
  if (!event) return { title: "Event not found" };
  const summary = `${formatWhen(event.startsAt)} at ${event.venue}. ${event.description}`;
  return {
    title: event.title,
    description: summary,
    alternates: { canonical: `/events/${event.id}` },
    openGraph: { title: event.title, description: summary, type: "website", url: `/events/${event.id}` },
  };
}

// Structured data: tells Google this page is an event, with a date, a place and a price, so it can
// show it as one in search results.
function eventJsonLd(event: TikitiEvent) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: event.title,
    startDate: event.startsAt,
    endDate: event.endsAt,
    eventStatus: event.status === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: event.venue, address: event.address },
    performer: event.lineUp.map((act) => ({ "@type": "MusicGroup", name: act.name })),
    offers: {
      "@type": "Offer",
      price: event.priceKes,
      priceCurrency: "KES",
      availability: event.available > 0 && event.status === "published" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      url: `https://tikiti.example/events/${event.id}`,
    },
  };
}

// The event is awaited BEFORE anything is sent, so a missing one is a real 404. (A route-level
// loading.tsx would start sending the page, with a 200, before we knew the event didn't exist.)
// Only the slow, optional part below is streamed.
export default async function EventPage({ params }: Props) {
  const event = await load(params);
  if (!event) notFound();

  return (
    <article className="event-page">
      <script
        type="application/ld+json"
        // JSON.stringify can't produce "</script>" on its own, but an event title could contain it: escape "<".
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd(event)).replace(/</g, "\\u003c") }}
      />
      <Link className="back-link" href="/">
        ← All events
      </Link>
      <div className="event-hero event-hero-buy">
        <Poster event={event} large />
        <div className="buy-box">
          <p className="eyebrow">{event.genre}</p>
          <h1>{event.title}</h1>
          <p className="event-hero-meta">
            <time dateTime={event.startsAt}>{formatWhen(event.startsAt)}</time>
            <span>{event.venue}</span>
          </p>
          {event.lineUp.length > 0 && (
            <ul className="lineup-list" aria-label="Line-up">
              {event.lineUp.map((act) => (
                <li key={act.name} data-headliner={act.headliner || undefined}>
                  {act.name}
                </li>
              ))}
            </ul>
          )}
          <p className="event-description">{event.description}</p>
          {event.status === "cancelled" ? (
            <p className="sold-out-note">This event was cancelled. Everyone who bought a ticket is being refunded to M-Pesa.</p>
          ) : (
            <div className="buy-panel">
              <div>
                <p className="price">
                  <small>From</small>
                  {formatKes(event.priceKes)}
                </p>
                <LiveSeats eventId={event.id} initial={event.available} capacity={event.capacity} />
              </div>
            </div>
          )}
        </div>
      </div>
      <section className="section" aria-labelledby="more-events">
        <div className="section-head">
          <h2 id="more-events">More events</h2>
        </div>
        <Suspense fallback={<MoreEventsSkeleton />}>
          <MoreEvents except={event.id} />
        </Suspense>
      </section>
    </article>
  );
}
