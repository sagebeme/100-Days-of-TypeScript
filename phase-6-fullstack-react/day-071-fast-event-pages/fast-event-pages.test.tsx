// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, within, act } from "@testing-library/react";
import { Suspense, type ReactElement } from "react";
import HomePage, { revalidate } from "./starter/app/page.tsx";
import EventPage, { generateMetadata, generateStaticParams } from "./starter/app/events/[id]/page.tsx";
import EventNotFound from "./starter/app/events/[id]/not-found.tsx";
import { MoreEvents } from "./starter/app/events/[id]/MoreEvents.tsx";
import { LiveSeats, SEATS_POLL_MS } from "./starter/app/events/[id]/LiveSeats.tsx";
import { GET } from "./starter/app/api/events/[id]/seats/route.ts";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const params = (id: string) => ({ params: Promise.resolve({ id }) });

// Server components are async functions: call one, then render what it returns. Any async
// children inside <Suspense> are resolved separately in their own tests.
async function renderPage(id: string) {
  const ui = (await EventPage(params(id))) as ReactElement;
  render(<Suspense fallback={null}>{ui}</Suspense>);
}

async function notFoundDigest(work: Promise<unknown>): Promise<string | undefined> {
  const error = (await work.then(() => null, (e: unknown) => e)) as { digest?: string } | null;
  return error?.digest;
}

describe("the home page", () => {
  it("is rebuilt in the background at most once a minute", () => {
    expect(revalidate).toBe(60);
  });

  it("lists what's on sale by date, and cancelled events separately, never drafts", async () => {
    render(await HomePage());
    const onSale = screen.getByRole("region", { name: "On sale" });
    expect(within(onSale).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Gengetone Block Party",
      "Benga Sundowner",
      "Jioni Jazz Night",
      "Afrobeats in the Park",
    ]);
    expect(within(screen.getByRole("region", { name: "Cancelled" })).getByText("Laugh Industry Live")).toBeTruthy();
    expect(screen.queryByText("Secret Rooftop Set")).toBeNull();
    expect(within(onSale).getByRole("link", { name: "Jioni Jazz Night" }).getAttribute("href")).toBe("/events/1");
  });
});

describe("the event page", () => {
  it("shows the event, its line-up and live seats", async () => {
    await renderPage("2");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Gengetone Block Party");
    expect(screen.getByRole("list", { name: "Line-up" }).textContent).toBe("Mtaa SoundOdi RiderKaka BassDJ Shiko");
    expect(screen.getByText("Only 14 left")).toBeTruthy();
    expect(document.querySelector("time")?.getAttribute("datetime")).toBe("2026-12-05T15:00:00+03:00");
  });

  it("tells search engines it's an event, with a price and a place", async () => {
    await renderPage("1");
    const data = JSON.parse(document.querySelector('script[type="application/ld+json"]')!.textContent!);
    expect(data).toMatchObject({
      "@context": "https://schema.org",
      "@type": "MusicEvent",
      name: "Jioni Jazz Night",
      startDate: "2026-12-12T18:00:00+03:00",
      eventStatus: "https://schema.org/EventScheduled",
      location: { "@type": "Place", name: "Uhuru Gardens" },
      offers: { price: 2500, priceCurrency: "KES", availability: "https://schema.org/InStock" },
    });
    expect(data.performer).toHaveLength(3);
  });

  it("marks a sold-out event, and a cancelled one, in the structured data too", async () => {
    await renderPage("3");
    expect(JSON.parse(document.querySelector('script[type="application/ld+json"]')!.textContent!).offers.availability).toBe("https://schema.org/SoldOut");
    cleanup();
    await renderPage("4");
    expect(JSON.parse(document.querySelector('script[type="application/ld+json"]')!.textContent!).eventStatus).toBe("https://schema.org/EventCancelled");
    expect(screen.getByText(/This event was cancelled/)).toBeTruthy();
  });

  it("is a real 404 for events that don't exist, drafts, and ids that aren't ids", async () => {
    for (const id of ["99", "6", "abc", "0", "1.5", "01"]) {
      expect(await notFoundDigest(EventPage(params(id)))).toBe("NEXT_HTTP_ERROR_FALLBACK;404");
    }
  });

  it("has a helpful not-found page", () => {
    render(<EventNotFound />);
    expect(screen.getByRole("heading", { name: "We can't find that event" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "See what's on" }).getAttribute("href")).toBe("/");
  });

  it("streams the slower 'More events' part in a Suspense boundary", async () => {
    const page = (await EventPage(params("1"))) as ReactElement;
    // Look through the returned elements for a <Suspense> with <MoreEvents> inside it.
    const find = (node: unknown): ReactElement | undefined => {
      if (Array.isArray(node)) return node.map(find).find(Boolean);
      if (!node || typeof node !== "object" || !("props" in node)) return undefined;
      const element = node as ReactElement<{ children?: unknown }>;
      return element.type === Suspense ? element : find(element.props.children);
    };
    const boundary = find(page) as ReactElement<{ children: ReactElement }> | undefined;
    expect(boundary?.props.children.type).toBe(MoreEvents);
    render(await MoreEvents({ except: 1 }));
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Gengetone Block Party", "Benga Sundowner", "Afrobeats in the Park"]);
  });
});

describe("metadata and prebuilding", () => {
  it("prebuilds a page for every event on sale", async () => {
    expect(await generateStaticParams()).toEqual([{ id: "1" }, { id: "2" }, { id: "3" }, { id: "5" }]);
  });

  it("gives each event a title, description and link preview", async () => {
    const metadata = await generateMetadata(params("1"));
    expect(metadata.title).toBe("Jioni Jazz Night");
    expect(metadata.description).toMatch(/^Sat 12 Dec · 6:00 pm at Uhuru Gardens\. Five hours of jazz/);
    expect(metadata.openGraph).toMatchObject({ title: "Jioni Jazz Night", url: "/events/1" });
    expect(metadata.alternates?.canonical).toBe("/events/1");
    expect((await generateMetadata(params("99"))).title).toBe("Event not found");
  });
});

describe("the seats route", () => {
  const call = (id: string) => GET(new Request(`http://localhost/api/events/${id}/seats`), params(id));

  it("answers with just the number, and forbids caching it", async () => {
    const response = await call("3");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ available: 0 });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("is a 404 for anything that isn't a public event", async () => {
    for (const id of ["99", "6", "abc"]) expect((await call(id)).status).toBe(404);
  });
});

describe("LiveSeats", () => {
  function fakeFetch(available: number) {
    const fetchFn = vi.fn(async () => Response.json({ available }));
    vi.stubGlobal("fetch", fetchFn);
    return fetchFn;
  }

  it("starts with the number from the server, without fetching", () => {
    const fetchFn = fakeFetch(5);
    render(<LiveSeats eventId={2} initial={14} capacity={1200} />);
    expect(screen.getByText("Only 14 left")).toBeTruthy();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("refreshes every 15 seconds", async () => {
    vi.useFakeTimers();
    const fetchFn = fakeFetch(9);
    render(<LiveSeats eventId={2} initial={14} capacity={1200} />);
    expect(SEATS_POLL_MS).toBe(15_000);
    await act(() => vi.advanceTimersByTimeAsync(15_000));
    expect(fetchFn).toHaveBeenCalledWith("/api/events/2/seats", { cache: "no-store" });
    expect(screen.getByText("Only 9 left")).toBeTruthy();
  });

  it("doesn't poll while the tab is hidden, and catches up when it's shown", async () => {
    vi.useFakeTimers();
    const fetchFn = fakeFetch(3);
    let state: DocumentVisibilityState = "hidden";
    vi.spyOn(document, "visibilityState", "get").mockImplementation(() => state);
    render(<LiveSeats eventId={2} initial={14} capacity={1200} />);
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(fetchFn).not.toHaveBeenCalled();
    state = "visible";
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchFn).toHaveBeenCalledOnce();
    expect(screen.getByText("Only 3 left")).toBeTruthy();
  });

  it("keeps the number it has when a refresh fails", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    render(<LiveSeats eventId={2} initial={14} capacity={1200} />);
    await act(() => vi.advanceTimersByTimeAsync(15_000));
    expect(screen.getByText("Only 14 left")).toBeTruthy();
  });
});
