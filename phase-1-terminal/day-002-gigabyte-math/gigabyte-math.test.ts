import { describe, it, expect } from "vitest";
import { estimateVideoMinutes } from "./starter/gigabyte-math.ts";

describe("estimateVideoMinutes", () => {
  it("converts 1 GB at 8 MB/min into 128 minutes", () => {
    expect(estimateVideoMinutes(1, 8)).toBe(128);
  });

  it("converts 2 GB at 10 MB/min into 204 minutes", () => {
    expect(estimateVideoMinutes(2, 10)).toBe(204);
  });

  it("rounds down instead of giving a fraction of a minute", () => {
    expect(estimateVideoMinutes(0.5, 4)).toBe(128);
  });
});
