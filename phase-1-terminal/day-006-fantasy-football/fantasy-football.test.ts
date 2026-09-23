import { describe, it, expect } from "vitest";
import { calculateFantasyPoints } from "./starter/fantasy-football.ts";

describe("calculateFantasyPoints", () => {
  it("adds goals, assists, and a clean sheet bonus", () => {
    const total = calculateFantasyPoints([
      { goals: 2, assists: 1, cleanSheet: false },
      { goals: 0, assists: 0, cleanSheet: true },
    ]);
    expect(total).toBe(15);
  });

  it("returns 0 for an empty squad", () => {
    expect(calculateFantasyPoints([])).toBe(0);
  });

  it("handles a squad with no goals or assists, just clean sheets", () => {
    const total = calculateFantasyPoints([
      { goals: 0, assists: 0, cleanSheet: true },
      { goals: 0, assists: 0, cleanSheet: true },
    ]);
    expect(total).toBe(8);
  });

  it("scores a single big performance correctly", () => {
    const total = calculateFantasyPoints([{ goals: 3, assists: 2, cleanSheet: true }]);
    expect(total).toBe(3 * 4 + 2 * 3 + 4);
  });
});
