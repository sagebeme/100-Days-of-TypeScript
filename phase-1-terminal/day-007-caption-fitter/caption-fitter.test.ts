import { describe, it, expect } from "vitest";
import { smsParts, fitsInXPost } from "./starter/caption-fitter.ts";

describe("smsParts", () => {
  it("fits 160 characters in one SMS", () => {
    expect(smsParts("a".repeat(160))).toBe(1);
  });

  it("splits longer texts into 153-char parts", () => {
    expect(smsParts("a".repeat(161))).toBe(2);
  });

  it("needs 3 parts for 307 characters", () => {
    expect(smsParts("a".repeat(307))).toBe(3);
  });

  it("fits a short message in one part", () => {
    expect(smsParts("Habari!")).toBe(1);
  });
});

describe("fitsInXPost", () => {
  it("fits exactly 280 characters", () => {
    expect(fitsInXPost("a".repeat(280))).toBe(true);
  });

  it("rejects 281 characters", () => {
    expect(fitsInXPost("a".repeat(281))).toBe(false);
  });
});
