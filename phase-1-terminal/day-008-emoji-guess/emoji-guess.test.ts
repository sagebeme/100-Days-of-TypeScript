import { describe, it, expect } from "vitest";
import { countAttemptsUntilCorrect } from "./starter/emoji-guess.ts";

describe("countAttemptsUntilCorrect", () => {
  it("counts up to and including the correct guess", () => {
    expect(countAttemptsUntilCorrect(["Sauti Sol", "Bien", "Nyashinski"], "Nyashinski")).toBe(3);
  });

  it("returns 1 when the first guess is correct", () => {
    expect(countAttemptsUntilCorrect(["Right"], "Right")).toBe(1);
  });

  it("returns -1 when nobody guesses correctly", () => {
    expect(countAttemptsUntilCorrect(["Wrong", "Also Wrong"], "Right")).toBe(-1);
  });

  it("returns -1 for an empty list of guesses", () => {
    expect(countAttemptsUntilCorrect([], "Anything")).toBe(-1);
  });
});
