import { describe, it, expect } from "vitest";
import {
  weeklyToMonthly,
  monthsToAfford,
  monthsToAffordFromWeekly,
} from "./starter/save-for-ps5.ts";

describe("weeklyToMonthly", () => {
  it("multiplies weekly savings by 4", () => {
    expect(weeklyToMonthly(500)).toBe(2000);
  });
});

describe("monthsToAfford", () => {
  it("divides price by monthly savings", () => {
    expect(monthsToAfford(60000, 2000)).toBe(30);
  });

  it("rounds up when there's a remainder", () => {
    expect(monthsToAfford(1000, 300)).toBe(4);
  });
});

describe("monthsToAffordFromWeekly", () => {
  it("composes weeklyToMonthly and monthsToAfford", () => {
    expect(monthsToAffordFromWeekly(60000, 500)).toBe(30);
  });
});
