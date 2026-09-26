import Link from "next/link";

// What notFound() shows, with a real 404 status, so search engines drop dead links.
export default function EventNotFound() {
  return (
    <section className="prompt-panel" aria-labelledby="not-found">
      <div className="fail-mark" aria-hidden="true">?</div>
      <h1 id="not-found">We can't find that event</h1>
      <p>It may have been removed, or the link is missing a bit. Here's everything that's on.</p>
      <Link className="button button-primary" href="/">
        See what's on
      </Link>
    </section>
  );
}
