import Link from "next/link";

// TODO: what notFound() shows (with a real 404 status):
// <section className="prompt-panel" aria-labelledby="not-found">
//   <div className="fail-mark" aria-hidden="true">?</div>
//   <h1 id="not-found">We can't find that event</h1>
//   <p>It may have been removed, or the link is missing a bit. Here's everything that's on.</p>
//   <Link className="button button-primary" href="/">See what's on</Link>
// </section>
export default function EventNotFound() {
  void Link;
  return <p>TODO: not found</p>;
}
