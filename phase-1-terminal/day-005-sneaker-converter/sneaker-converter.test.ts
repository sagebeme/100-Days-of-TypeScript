import { describe, it, expect } from "vitest";
import { usToEuSize, convertPriceToKes } from "./starter/sneaker-converter.ts";

describe("usToEuSize", () => {
  it("converts US 8 to EU 41", () => {
    expect(usToEuSize(8)).toBe(41);
  });

  it("converts US 10 to EU 43", () => {
    expect(usToEuSize(10)).toBe(43);
  });
});

describe("convertPriceToKes", () => {
  it("converts $20 at a rate of 129 to 2580 KES", () => {
    expect(convertPriceToKes(20, 129)).toBe(2580);
  });

  it("rounds to a whole shilling", () => {
    expect(convertPriceToKes(19.99, 129)).toBe(2579);
  });
});
