import { describe, it, expect } from "vitest";
import { buildGamerTag } from "./starter/gamer-tag.ts";

describe("buildGamerTag", () => {
  it("wraps a name and number in the xX_..._Xx bracket", () => {
    expect(buildGamerTag("Amina", 7)).toBe("xX_Amina7_Xx");
  });

  it("works for a different name and number", () => {
    expect(buildGamerTag("Kip", 10)).toBe("xX_Kip10_Xx");
  });

  it("keeps the name and number stuck together with no separator", () => {
    expect(buildGamerTag("Zawadi", 1)).toBe("xX_Zawadi1_Xx");
  });
});
