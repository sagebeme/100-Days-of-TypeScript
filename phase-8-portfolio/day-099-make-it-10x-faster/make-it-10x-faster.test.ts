import { describe, it, expect } from "vitest";
import { makeSeason, type Season } from "./starter/season.ts";
import { seasonReport as original } from "./starter/original-report.ts";
import { seasonReport } from "./starter/report.ts";

const TEST_SIZE = { users: 1500, events: 120, orders: 3000 };

describe("the same answers", () => {
  it.each([1, 2, 3, 42])("on season %i: every number, name and order is identical", (seed) => {
    const season = makeSeason(seed, TEST_SIZE);
    expect(seasonReport(season)).toStrictEqual(original(season));
  });

  it("on a small season, where the ties are more likely", () => {
    const season = makeSeason(5, { users: 12, events: 6, orders: 60 });
    expect(seasonReport(season)).toStrictEqual(original(season));
  });

  it("on an empty season", () => {
    const empty: Season = { users: [], events: [], orders: [], tickets: [] };
    expect(seasonReport(empty)).toStrictEqual(original(empty));
  });

  it("for an event nobody bought, and orders that were never paid", () => {
    const season: Season = {
      users: [
        { id: 1, name: "Amina K." },
        { id: 2, name: "Brian O." },
      ],
      events: [
        { id: 1, title: "Jioni Jazz Night", startsAt: "2026-12-12T15:00:00Z", capacity: 100, priceKes: 1000 },
        { id: 2, title: "Empty Room", startsAt: "2026-12-13T15:00:00Z", capacity: 100, priceKes: 500 },
      ],
      orders: [
        { id: 1, eventId: 1, userId: 2, quantity: 2, amountKes: 2000, status: "paid", createdAt: "2026-11-30T21:30:00Z" }, // 00:30 on 1 Dec in Nairobi
        { id: 2, eventId: 1, userId: 1, quantity: 2, amountKes: 2000, status: "paid", createdAt: "2026-11-02T08:00:00Z" },
        { id: 3, eventId: 2, userId: 1, quantity: 4, amountKes: 2000, status: "failed", createdAt: "2026-11-03T08:00:00Z" },
      ],
      tickets: [
        { id: 1, orderId: 1, checkedInAt: "2026-12-12T15:10:00Z" },
        { id: 2, orderId: 2, checkedInAt: null },
        { id: 3, orderId: 1, checkedInAt: null },
        { id: 4, orderId: 2, checkedInAt: "2026-12-12T15:20:00Z" },
      ],
    };
    const report = seasonReport(season);
    expect(report).toStrictEqual(original(season));
    expect(report.months.map((m) => m.month)).toEqual(["2026-11", "2026-12"]); // Nairobi time, not UTC
    expect(report.events[0].topBuyer).toBe("Amina K."); // a tie on tickets goes to the name first
    expect(report.events[1]).toMatchObject({ title: "Empty Room", sold: 0, showUpRate: 0, topBuyer: null });
  });
});

describe("10x faster", () => {
  // The best of several runs of each, in the same process, so a busy computer slows both alike.
  function best(run: () => unknown, times: number): number {
    let fastest = Infinity;
    for (let i = 0; i < times; i++) {
      const started = performance.now();
      run();
      fastest = Math.min(fastest, performance.now() - started);
    }
    return fastest;
  }

  it("than the original, on a season of 3,000 orders", { timeout: 60_000 }, () => {
    const season = makeSeason(7, TEST_SIZE);
    seasonReport(season); // let the JIT warm up
    const yours = best(() => seasonReport(season), 5);
    const theirs = best(() => original(season), 2);
    console.log(`original ${theirs.toFixed(0)} ms, yours ${yours.toFixed(1)} ms: ${(theirs / yours).toFixed(0)}x`);
    expect(theirs / yours).toBeGreaterThanOrEqual(10);
  });
});
