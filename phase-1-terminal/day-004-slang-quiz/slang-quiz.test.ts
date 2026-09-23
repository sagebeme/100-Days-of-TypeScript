import { describe, it, expect } from "vitest";
import { pickRandomWord } from "./starter/slang-quiz.ts";

describe("pickRandomWord", () => {
  const words = ["noma", "mbogi", "poa"];

  it("picks the first word when random() returns 0", () => {
    expect(pickRandomWord(words, () => 0)).toBe("noma");
  });

  it("picks the last word when random() returns just under 1", () => {
    expect(pickRandomWord(words, () => 0.999)).toBe("poa");
  });

  it("picks the middle word when random() lands there", () => {
    expect(pickRandomWord(words, () => 0.5)).toBe("mbogi");
  });

  it("always returns one of the given words with real randomness", () => {
    for (let i = 0; i < 20; i++) {
      expect(words).toContain(pickRandomWord(words));
    }
  });
});
