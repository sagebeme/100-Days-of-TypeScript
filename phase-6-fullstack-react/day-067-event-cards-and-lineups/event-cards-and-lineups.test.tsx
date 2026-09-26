// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import { formatKes, formatWhen, availability } from "./starter/format.ts";
import { PriceTag } from "./starter/PriceTag.tsx";
import { Availability } from "./starter/Availability.tsx";
import { LineUp } from "./starter/LineUp.tsx";
import { EventCard } from "./starter/EventCard.tsx";
import { EventGrid } from "./starter/EventGrid.tsx";
import { EVENTS } from "./starter/events.ts";
import type { TikitiEvent } from "./starter/types.ts";

afterEach(cleanup);

const event = (changes: Partial<TikitiEvent> = {}): TikitiEvent => ({ ...EVENTS[0], ...changes });

describe("formatting", () => {
  it("writes shillings the Kenyan way, and 0 as Free", () => {
    expect(formatKes(2500)).toBe("KES 2,500");
    expect(formatKes(150000)).toBe("KES 150,000");
    expect(formatKes(800)).toBe("KES 800");
    expect(formatKes(0)).toBe("Free");
  });

  it("writes the date and time in Nairobi time, whatever the offset it was given in", () => {
    expect(formatWhen("2026-12-12T18:00:00+03:00")).toBe("Sat 12 Dec · 6:00 pm");
    expect(formatWhen("2026-12-05T12:00:00Z")).toBe("Sat 5 Dec · 3:00 pm");
    expect(formatWhen("2026-12-06T21:30:00Z")).toBe("Mon 7 Dec · 12:30 am");
  });

  it("describes the seats left", () => {
    const seats = (available: number, capacity = 500, status = "published") => availability({ available, capacity, status });
    expect(seats(212)).toEqual({ tone: "ok", label: "On sale" });
    expect(seats(50)).toEqual({ tone: "low", label: "Only 50 left" }); // 10% of 500
    expect(seats(51)).toEqual({ tone: "ok", label: "On sale" });
    expect(seats(20, 100)).toEqual({ tone: "low", label: "Only 20 left" }); // small venues: 20 seats
    expect(seats(0)).toEqual({ tone: "sold-out", label: "Sold out" });
    expect(seats(100, 500, "cancelled")).toEqual({ tone: "cancelled", label: "Cancelled" });
  });
});

describe("small components", () => {
  it("PriceTag says From and the price, or just Free", () => {
    const { container, rerender } = render(<PriceTag priceKes={2500} />);
    expect(container.textContent).toBe("FromKES 2,500");
    rerender(<PriceTag priceKes={0} />);
    expect(container.textContent).toBe("Free");
  });

  it("Availability is a badge with words, not just a colour", () => {
    render(<Availability event={{ status: "published", available: 14, capacity: 1200 }} />);
    const badge = screen.getByText("Only 14 left");
    expect(badge.className).toBe("badge");
    expect(badge.dataset.tone).toBe("low");
  });

  it("LineUp puts headliners first, in bold, then everyone else", () => {
    const { container } = render(
      <LineUp acts={[{ name: "Kaka Bass" }, { name: "Mtaa Sound", headliner: true }, { name: "DJ Shiko" }, { name: "Odi Rider", headliner: true }]} />,
    );
    expect(container.textContent).toBe("Mtaa Sound and Odi Rider with Kaka Bass and DJ Shiko");
    expect(container.querySelector("strong")?.textContent).toBe("Mtaa Sound and Odi Rider");
  });

  it("LineUp copes with only headliners, only support acts, and nobody announced", () => {
    const { container, rerender } = render(<LineUp acts={[{ name: "Zawadi Waves", headliner: true }]} />);
    expect(container.textContent).toBe("Zawadi Waves");
    rerender(<LineUp acts={[{ name: "Wambui Keys" }, { name: "Brass Matatu" }]} />);
    expect(container.textContent).toBe("Wambui Keys and Brass Matatu");
    expect(container.querySelector("strong")).toBeNull();
    rerender(<LineUp acts={[]} />);
    expect(container.innerHTML).toBe("");
  });
});

describe("EventCard", () => {
  it("is an article named by its title, with a link to the event", () => {
    render(<EventCard event={event()} />);
    const card = screen.getByRole("article", { name: "Jioni Jazz Night" });
    const link = within(card).getByRole("link", { name: "Jioni Jazz Night" });
    expect(link.getAttribute("href")).toBe("#/events/1");
    expect(within(card).getByRole("heading", { level: 3 }).textContent).toBe("Jioni Jazz Night");
  });

  it("shows when, where, who, how much, and how many are left", () => {
    render(<EventCard event={event()} />);
    const card = screen.getByRole("article");
    const time = card.querySelector("time")!;
    expect(time.getAttribute("datetime")).toBe("2026-12-12T18:00:00+03:00");
    expect(time.textContent).toBe("Sat 12 Dec · 6:00 pm");
    expect(card.textContent).toContain("Uhuru Gardens");
    expect(card.textContent).toContain("The Jioni Collective with Wambui Keys and Brass Matatu");
    expect(card.textContent).toContain("KES 2,500");
    expect(within(card).getByText("On sale")).toBeTruthy();
  });

  it("uses the Poster, and hides it from screen readers", () => {
    render(<EventCard event={event()} />);
    expect(screen.getByRole("article").querySelector(".poster")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("doesn't show a price for a cancelled event", () => {
    render(<EventCard event={event({ status: "cancelled" })} />);
    const card = screen.getByRole("article");
    expect(card.textContent).not.toContain("KES");
    expect(card.textContent).toContain("Cancelled");
    expect(card.dataset.status).toBe("cancelled");
  });
});

describe("EventGrid", () => {
  it("lists a card for every event, under its heading", () => {
    render(<EventGrid heading="Coming up" events={EVENTS} emptyMessage="Nothing yet" />);
    const section = screen.getByRole("region", { name: "Coming up" });
    const items = within(section).getAllByRole("listitem");
    expect(items).toHaveLength(EVENTS.length);
    expect(items.map((item) => within(item).getByRole("heading").textContent)).toEqual(EVENTS.map((e) => e.title));
    expect(section.textContent).toContain(`${EVENTS.length} events`);
  });

  it("says 1 event, not 1 events", () => {
    render(<EventGrid heading="Tonight" events={[EVENTS[0]]} emptyMessage="Nothing yet" />);
    expect(screen.getByRole("region").textContent).toContain("1 event");
    expect(screen.getByRole("region").textContent).not.toContain("1 events");
  });

  it("shows the empty message instead of an empty list", () => {
    render(<EventGrid heading="Just announced" events={[]} emptyMessage="Check back on Monday." />);
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.getByText("Check back on Monday.")).toBeTruthy();
  });

  it("keeps each card with its event when the order changes (keys are the ids)", () => {
    const { rerender } = render(<EventGrid heading="All" events={EVENTS} emptyMessage="" />);
    const first = screen.getByRole("article", { name: EVENTS[0].title });
    rerender(<EventGrid heading="All" events={[...EVENTS].reverse()} emptyMessage="" />);
    expect(screen.getByRole("article", { name: EVENTS[0].title })).toBe(first); // the same DOM node, moved
  });
});
