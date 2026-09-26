import { describe, it, expect } from "vitest";
import { slugify, transliterate } from "../src/index.ts";

describe("slugify", () => {
  it("joins words with dashes, in lower case", () => {
    expect(slugify("Jioni Jazz Night")).toBe("jioni-jazz-night");
    expect(slugify("  Many   spaces  ")).toBe("many-spaces");
  });

  it("drops accents", () => {
    expect(slugify("Café Ngoma")).toBe("cafe-ngoma");
    expect(slugify("Mũthoni and Wanjikũ")).toBe("muthoni-and-wanjiku");
  });

  it("drops punctuation", () => {
    expect(slugify("Live!")).toBe("live");
    expect(slugify("Sauti za Pwani (2026)")).toBe("sauti-za-pwani-2026");
  });

  it("keeps words with apostrophes together", () => {
    expect(slugify("It's Ng'ombe Day")).toBe("its-ngombe-day");
    expect(slugify("Wanjiru’s Party")).toBe("wanjirus-party");
  });

  it("spells out & and @", () => {
    expect(slugify("Rock & Roll @ Uhuru")).toBe("rock-and-roll-at-uhuru");
  });

  it("keeps capitals with lowercase: false", () => {
    expect(slugify("Jioni Jazz", { lowercase: false })).toBe("Jioni-Jazz");
  });

  it("uses another separator", () => {
    expect(slugify("Jioni Jazz Night", { separator: "_" })).toBe("jioni_jazz_night");
  });

  it("cuts at a word boundary for maxLength (#9)", () => {
    expect(slugify("Jioni Jazz Night", { maxLength: 13 })).toBe("jioni-jazz");
    expect(slugify("Jioni Jazz Night", { maxLength: 10 })).toBe("jioni-jazz");
    expect(slugify("Supercalifragilistic", { maxLength: 5 })).toBe("super");
  });
});

describe("transliterate", () => {
  it("spells letters the Latin way", () => {
    expect(transliterate("Ærøskøbing")).toBe("AEroskobing");
    expect(transliterate("Straße")).toBe("Strasse");
  });
});

describe("fixed in 2.3.2", () => {
  it("never makes double separators, or puts them on the ends (#12, #24)", () => {
    expect(slugify("Jazz 🎷 Night")).toBe("jazz-night");
    expect(slugify("Party 🎉🎉 Time")).toBe("party-time");
    expect(slugify("Jioni — Live")).toBe("jioni-live");
    expect(slugify("— Jazz —")).toBe("jazz");
  });

  it("spells West African letters the Latin way (#15)", () => {
    expect(slugify("Ɔsɛe Festival")).toBe("osee-festival");
    expect(slugify("Ŋutifafa Ɓaki")).toBe("ngutifafa-baki");
  });

  it("never ends in a separator after maxLength (#19)", () => {
    expect(slugify("Jioni — Jazz Night", { maxLength: 6 })).toBe("jioni");
  });

  it("says what's wrong when the text isn't a string (#23)", () => {
    expect(() => slugify(undefined as unknown as string)).toThrow(new TypeError("slugify expects a string, but got undefined (#23)"));
  });

  it("works with any separator (#26)", () => {
    expect(slugify("Jioni Jazz Night", { separator: "." })).toBe("jioni.jazz.night");
    expect(slugify("Jioni Jazz Night", { separator: "" })).toBe("jionijazznight");
  });
});
