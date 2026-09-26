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
