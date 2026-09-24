import { describe, it, expect } from "vitest";
import { firstAbove, firstAboveOrDefault } from "./starter/pro-setup.ts";

describe("firstAbove", () => {
  it("returns the first number above the threshold", () => {
    expect(firstAbove([3, 8, 12], 5)).toBe(8);
  });

  it("returns undefined when nothing is above the threshold", () => {
    expect(firstAbove([1, 2], 5)).toBeUndefined();
  });

  it("returns undefined for an empty list", () => {
    expect(firstAbove([], 0)).toBeUndefined();
  });
});

describe("firstAboveOrDefault", () => {
  it("returns the match when there is one", () => {
    expect(firstAboveOrDefault([3, 8, 12], 5, 99)).toBe(8);
  });

  it("returns the fallback when there is no match", () => {
    expect(firstAboveOrDefault([1, 2], 5, 99)).toBe(99);
  });

  it("keeps a real 0 instead of swapping in the fallback", () => {
    expect(firstAboveOrDefault([0, 5], -1, 99)).toBe(0);
  });
});
