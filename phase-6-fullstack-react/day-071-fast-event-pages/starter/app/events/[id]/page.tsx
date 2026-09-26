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

// Already written: "/events/abc", "/events/0" and "/events/1.5" aren't events.
async function load(params: Props["params"]): Promise<TikitiEvent | null> {
  const { id } = await params;
  return /^[1-9]\d*$/.test(id) ? getEvent(Number(id)) : null;
}

// TODO: a page for every PUBLISHED event, built ahead of time: [{ id: "1" }, { id: "2" }, ...] (strings).
export async function generateStaticParams(): Promise<{ id: string }[]> {
  void listEvents;
  return [];
}

// TODO: what search engines and link previews show.
// No event: { title: "Event not found" }. Otherwise, with summary = `${formatWhen(startsAt)} at ${venue}. ${description}`:
// { title, description: summary, alternates: { canonical: "/events/1" }, openGraph: { title, description: summary, type: "website", url: "/events/1" } }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  void load(params);
  return {};
}

// TODO: structured data (https://schema.org/MusicEvent), so search engines know this page is an event:
// { "@context": "https://schema.org", "@type": "MusicEvent", name, startDate, endDate,
//   eventStatus: "https://schema.org/EventCancelled" or "https://schema.org/EventScheduled",
//   location: { "@type": "Place", name: venue, address },
//   performer: one { "@type": "MusicGroup", name } per act,
//   offers: { "@type": "Offer", price, priceCurrency: "KES",
//             availability: "https://schema.org/InStock" (published, seats left) or "https://schema.org/SoldOut",
//             url: "https://tikiti.example/events/1" } }
function eventJsonLd(event: TikitiEvent): object {
  void event;
  return {};
}

// TODO: the page. Await the event FIRST and call notFound() if there isn't one, before anything is
// sent, so a missing event is a real 404. Then:
// <article className="event-page">
//   <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd(event)).replace(/</g, "\\u003c") }} />
//   <Link className="back-link" href="/">← All events</Link>
//   <div className="event-hero event-hero-buy">
//     <Poster event={event} large />
//     <div className="buy-box">
//       <p className="eyebrow">genre</p> <h1>title</h1>
//       <p className="event-hero-meta"><time dateTime>formatWhen</time><span>venue</span></p>
//       if there are acts: <ul className="lineup-list" aria-label="Line-up"> <li data-headliner={headliner || undefined}>name</li>
//       <p className="event-description">description</p>
//       cancelled: <p className="sold-out-note">This event was cancelled. Everyone who bought a ticket is being refunded to M-Pesa.</p>
//       otherwise: <div className="buy-panel"><div><p className="price"><small>From</small>KES 2,500</p>
//                  <LiveSeats eventId initial={available} capacity /></div></div>
//   </div></div>
//   <section className="section" aria-labelledby="more-events"><div className="section-head"><h2 id="more-events">More events</h2></div>
//     <Suspense fallback={<MoreEventsSkeleton />}><MoreEvents except={event.id} /></Suspense>
//   </section>
// </article>
export default async function EventPage({ params }: Props) {
  const event = await load(params);
  void [Link, Suspense, notFound, formatKes, formatWhen, Poster, LiveSeats, MoreEvents, MoreEventsSkeleton, eventJsonLd];
  return <p>TODO: the page for {event?.title ?? "an event"}</p>;
}
