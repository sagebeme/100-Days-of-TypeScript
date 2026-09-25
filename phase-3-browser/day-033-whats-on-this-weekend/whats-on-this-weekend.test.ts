// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isEventItem,
  fetchEvents,
  weekendDates,
  weekendEvents,
  formatPrice,
  formatWhen,
  type EventItem,
  type Fetcher,
} from "./starter/events.ts";
import { mountEvents } from "./starter/app.ts";

const html = readFileSync(join(import.meta.dirname, "starter", "index.html"), "utf8");
const sample: EventItem[] = JSON.parse(readFileSync(join(import.meta.dirname, "starter", "public", "events.json"), "utf8"));
const THURSDAY = "2026-10-01";

function respondWith(body: unknown, status = 200): Fetcher {
  return vi.fn(async () => new Response(JSON.stringify(body), { status }));
}

const event = (overrides: Partial<EventItem> = {}): EventItem => ({
  id: "x",
  title: "Test",
  venue: "Somewhere",
  date: "2026-10-03",
  time: "20:00",
  priceKes: 1000,
  tags: [],
  ...overrides,
});

describe("isEventItem", () => {
  it("accepts paid and free events", () => {
    expect(isEventItem(event())).toBe(true);
    expect(isEventItem(event({ priceKes: null }))).toBe(true);
  });

  it.each([
    ["null", null],
    ["a string", "Gengetone Night"],
    ["a missing title", { ...event(), title: undefined }],
    ["a price as text", { ...event(), priceKes: "1000" }],
    ["tags that are not strings", { ...event(), tags: [1, 2] }],
    ["tags that are not an array", { ...event(), tags: "music" }],
  ])("rejects %s", (_label, value) => {
    expect(isEventItem(value)).toBe(false);
  });
});

describe("fetchEvents", () => {
  it("fetches the url and returns the events", async () => {
    const fetchFn = respondWith(sample);
    await expect(fetchEvents("/events.json", fetchFn)).resolves.toEqual(sample);
    expect(fetchFn).toHaveBeenCalledWith("/events.json");
  });

  it("throws with the status when the response is not ok", async () => {
    await expect(fetchEvents("/events.json", respondWith({ error: "nope" }, 404))).rejects.toThrow(
      "Request failed: 404",
    );
  });

  it("throws when the JSON is not a list of events", async () => {
    await expect(fetchEvents("/events.json", respondWith({ events: sample }))).rejects.toThrow(
      "Unexpected response shape",
    );
    await expect(fetchEvents("/events.json", respondWith([event(), { title: "half an event" }]))).rejects.toThrow(
      "Unexpected response shape",
    );
  });
});

describe("weekendDates", () => {
  it.each([
    ["2026-10-01", "Thursday", ["2026-10-03", "2026-10-04"]],
    ["2026-10-05", "Monday", ["2026-10-10", "2026-10-11"]],
    ["2026-10-03", "Saturday", ["2026-10-03", "2026-10-04"]],
    ["2026-10-04", "Sunday", ["2026-10-03", "2026-10-04"]],
    ["2026-12-31", "Thursday, across a new year", ["2027-01-02", "2027-01-03"]],
    ["2026-02-27", "Friday, across the end of February", ["2026-02-28", "2026-03-01"]],
  ])("from %s (%s)", (today, _label, expected) => {
    expect(weekendDates(today)).toEqual(expected);
  });
});

describe("weekendEvents", () => {
  it("keeps the weekend's events, earliest first", () => {
    expect(weekendEvents(sample, THURSDAY).map((e) => e.id)).toEqual(["e6", "e3", "e1", "e4", "e2"]);
  });

  it("does not reorder the list it was given", () => {
    const copy = [...sample];
    weekendEvents(copy, THURSDAY);
    expect(copy).toEqual(sample);
  });
});

describe("formatPrice and formatWhen", () => {
  it("formats prices", () => {
    expect(formatPrice(null)).toBe("Free");
    expect(formatPrice(500)).toBe("KES 500");
    expect(formatPrice(1500)).toBe("KES 1,500");
  });

  it("formats the day and time", () => {
    expect(formatWhen(event({ date: "2026-10-03", time: "21:00" }))).toBe("Sat 21:00");
    expect(formatWhen(event({ date: "2026-10-04", time: "09:30" }))).toBe("Sun 09:30");
  });
});

describe("mountEvents", () => {
  beforeEach(() => {
    document.body.innerHTML = new DOMParser().parseFromString(html, "text/html").body.innerHTML;
  });

  const status = () => document.querySelector("#status")?.textContent;
  const retry = () => document.querySelector<HTMLButtonElement>("#retry")!;
  const cards = () => [...document.querySelectorAll("#list li")];

  it("shows the weekend's events", async () => {
    await mountEvents(document, { url: "/events.json", today: THURSDAY, fetchFn: respondWith(sample) });
    expect(status()).toBe("5 events this weekend");
    expect(cards()).toHaveLength(5);
    const first = cards()[0];
    expect(first.querySelector("h2")?.textContent).toBe("Afrobeats Brunch");
    expect(first.querySelector("p")?.textContent).toBe("Sat 11:00 · Mercury Lounge");
    expect(first.querySelector(".price")?.textContent).toBe("KES 2,500");
    expect(retry().hidden).toBe(true);
  });

  it("says 'Loading…' while waiting", () => {
    const never: Fetcher = () => new Promise(() => {});
    void mountEvents(document, { url: "/events.json", today: THURSDAY, fetchFn: never });
    expect(status()).toBe("Loading…");
  });

  it("uses the singular for one event", async () => {
    await mountEvents(document, { url: "/", today: THURSDAY, fetchFn: respondWith([event()]) });
    expect(status()).toBe("1 event this weekend");
  });

  it("says when there's nothing on", async () => {
    await mountEvents(document, { url: "/", today: "2026-10-12", fetchFn: respondWith(sample) });
    expect(status()).toBe("Nothing on this weekend. Rest up.");
    expect(cards()).toHaveLength(0);
  });

  it("filters to free events without fetching again", async () => {
    const fetchFn = respondWith(sample);
    await mountEvents(document, { url: "/", today: THURSDAY, fetchFn });
    const freeOnly = document.querySelector<HTMLInputElement>("#free-only")!;
    freeOnly.checked = true;
    freeOnly.dispatchEvent(new Event("change"));
    expect(cards().map((c) => c.querySelector("h2")?.textContent)).toEqual(["Thrift Pop-up", "Sunday Picnic Jam"]);
    expect(status()).toBe("2 events this weekend");
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("shows fetched text as text, never as HTML", async () => {
    const sneaky = event({ title: '<img src=x onerror="alert(1)">' });
    await mountEvents(document, { url: "/", today: THURSDAY, fetchFn: respondWith([sneaky]) });
    expect(document.querySelector("#list img")).toBeNull();
    expect(cards()[0].querySelector("h2")?.textContent).toBe(sneaky.title);
  });

  it("shows an error and a Retry button when loading fails, and retries", async () => {
    const fetchFn = vi
      .fn<Fetcher>()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response(JSON.stringify(sample)));
    await mountEvents(document, { url: "/", today: THURSDAY, fetchFn });
    expect(status()).toBe("Couldn't load events. Check your connection and try again.");
    expect(retry().hidden).toBe(false);

    retry().click();
    await vi.waitFor(() => expect(status()).toBe("5 events this weekend"));
    expect(retry().hidden).toBe(true);
  });

  it("treats a server error like a network error", async () => {
    await mountEvents(document, { url: "/", today: THURSDAY, fetchFn: respondWith({}, 500) });
    expect(status()).toBe("Couldn't load events. Check your connection and try again.");
  });
});
