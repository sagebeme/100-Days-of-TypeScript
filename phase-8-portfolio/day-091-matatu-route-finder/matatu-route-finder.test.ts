import { describe, it, expect } from "vitest";
import { MinHeap } from "./starter/heap.ts";
import { planTrip, describe as describeTrip } from "./starter/planner.ts";
import { NAIROBI, type Network } from "./starter/network.ts";

describe("the priority queue", () => {
  it("always hands back the smallest first", () => {
    const heap = new MinHeap<number>((a, b) => a < b);
    for (const n of [5, 3, 9, 1, 7, 3, 8, 2]) heap.push(n);
    const out: number[] = [];
    while (heap.size) out.push(heap.pop()!);
    expect(out).toEqual([1, 2, 3, 3, 5, 7, 8, 9]);
    expect(heap.pop()).toBeUndefined();
  });

  it("stays in order with pushes between pops, and many items", () => {
    const heap = new MinHeap<{ cost: number }>((a, b) => a.cost < b.cost);
    const numbers = Array.from({ length: 500 }, (_, i) => (i * 7919) % 1000);
    numbers.forEach((cost) => heap.push({ cost }));
    const first = heap.pop()!.cost;
    heap.push({ cost: -1 });
    expect([first, heap.pop()!.cost]).toEqual([Math.min(...numbers), -1]);
  });
});

// A tiny network where the answers are easy to work out by hand.
const LINE: Network = {
  stages: ["a", "b", "c", "d", "e", "x"].map((id) => ({ id, name: id.toUpperCase(), x: 0, y: 0 })),
  routes: [
    { number: "1", colour: "red", stages: ["a", "b", "c"], minutes: [10, 10], fare: 50 },
    { number: "2", colour: "blue", stages: ["c", "d"], minutes: [10], fare: 40 },
    { number: "3", colour: "green", stages: ["a", "d"], minutes: [45], fare: 100 },
  ],
  walks: [{ between: ["d", "e"], minutes: 6 }],
};

describe("planning a trip", () => {
  it("rides one matatu when that's all it takes, counting the wait to board", () => {
    expect(planTrip(LINE, "a", "c", { changeMinutes: 5 })).toEqual({
      legs: [{ kind: "ride", route: "1", from: "a", to: "c", stops: 2, minutes: 20, fare: 50 }],
      minutes: 25,
      fare: 50,
      changes: 0,
    });
  });

  it("rides in either direction", () => {
    expect(planTrip(LINE, "c", "a", { changeMinutes: 5 })?.legs[0]).toMatchObject({ route: "1", from: "c", to: "a" });
  });

  it("changes matatus, paying each fare and each wait", () => {
    // 1 then 2: 20 + 10 minutes riding, two waits of 5 = 40, better than the 3's 45 + 5 = 50.
    const trip = planTrip(LINE, "a", "d", { changeMinutes: 5 })!;
    expect(trip.legs.map((l) => (l.kind === "ride" ? l.route : "walk"))).toEqual(["1", "2"]);
    expect([trip.minutes, trip.fare, trip.changes]).toEqual([40, 90, 1]);
  });

  it("takes the direct matatu when waiting makes changing slower", () => {
    // With 20-minute waits: 30 riding + 40 waiting = 70 by changing, against 45 + 20 = 65 direct.
    expect(planTrip(LINE, "a", "d", { changeMinutes: 20 })!.legs.map((l) => (l.kind === "ride" ? l.route : "walk"))).toEqual(["3"]);
  });

  it("can prefer fewer changes over a few minutes", () => {
    const trip = planTrip(LINE, "a", "d", { changeMinutes: 5, fewestChanges: true })!;
    expect(trip.legs).toEqual([{ kind: "ride", route: "3", from: "a", to: "d", stops: 1, minutes: 45, fare: 100 }]);
  });

  it("walks between stages when that's the way, and a walk isn't a change", () => {
    const trip = planTrip(LINE, "a", "e", { changeMinutes: 5 })!;
    expect(trip.legs.at(-1)).toEqual({ kind: "walk", from: "d", to: "e", minutes: 6 });
    expect(trip.changes).toBe(1);
  });

  it("says when there's no way there, and when you're already there", () => {
    expect(planTrip(LINE, "a", "x")).toBeNull();
    expect(planTrip(LINE, "b", "b")).toEqual({ legs: [], minutes: 0, fare: 0, changes: 0 });
    expect(() => planTrip(LINE, "a", "mars")).toThrow(/no stage called mars/);
  });
});

describe("across Nairobi", () => {
  it("finds a trip between every pair of stages", () => {
    for (const a of NAIROBI.stages) for (const b of NAIROBI.stages) expect(planTrip(NAIROBI, a.id, b.id)).not.toBeNull();
  });

  it("trades a few minutes for fewer changes, when asked", () => {
    const fastest = planTrip(NAIROBI, "kangemi", "rongai")!;
    const simplest = planTrip(NAIROBI, "kangemi", "rongai", { fewestChanges: true })!;
    expect(simplest.changes).toBeLessThan(fastest.changes);
    expect(simplest.minutes).toBeGreaterThanOrEqual(fastest.minutes);
  });

  it("describes a trip in plain words", () => {
    expect(describeTrip(NAIROBI, planTrip(NAIROBI, "eastleigh", "roysambu")!)).toBe(
      "Walk from Eastleigh to Pangani (14 min), then take the 45 from Pangani to Roysambu (1 stop, 25 min, KES 90). About 47 minutes, KES 90 in all.",
    );
    expect(describeTrip(NAIROBI, planTrip(NAIROBI, "kencom", "kencom")!)).toBe("You're already there.");
  });
});
