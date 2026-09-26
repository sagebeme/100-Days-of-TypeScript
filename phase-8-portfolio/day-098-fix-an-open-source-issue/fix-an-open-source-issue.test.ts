import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { slugify, transliterate } from "./starter/slugo/src/index.ts";

const read = (file: string) => readFileSync(join(import.meta.dirname, "starter", file), "utf8");

describe("the bugs are fixed", () => {
  it("#12 and #24: no double separators, and none on the ends", () => {
    expect(slugify("Jazz 🎷 Night")).toBe("jazz-night");
    expect(slugify("Party 🎉🎉 Time")).toBe("party-time");
    expect(slugify("Jioni — Live")).toBe("jioni-live");
    expect(slugify("— Jazz —")).toBe("jazz");
    expect(slugify("Mombasa | Raha ✨")).toBe("mombasa-raha"); // the cause, not the one example
    expect(slugify("🎷")).toBe("");
  });

  it("#15: West African letters get their Latin spelling", () => {
    expect(slugify("Ɔsɛe Festival")).toBe("osee-festival");
    expect(slugify("Ŋutifafa Ɓaki")).toBe("ngutifafa-baki");
    expect(transliterate("ƊƘƳ ɗƙƴ")).toBe("DKY dky");
  });

  it("#19: maxLength never leaves a separator on the end", () => {
    expect(slugify("Jioni — Jazz Night", { maxLength: 6 })).toBe("jioni");
    expect(slugify("Jioni — Jazz Night", { maxLength: 11 })).toBe("jioni-jazz");
    for (let max = 1; max <= 20; max++) {
      const slug = slugify("Jazz 🎷 — Night | Uhuru", { maxLength: max });
      expect(slug.length).toBeLessThanOrEqual(max);
      expect(slug).not.toMatch(/^-|-$|--/);
    }
  });

  it("#23: a clear TypeError when the text isn't a string", () => {
    for (const bad of [undefined, null, 42]) {
      expect(() => slugify(bad as unknown as string)).toThrow(TypeError);
      expect(() => slugify(bad as unknown as string)).toThrow(/slugify expects a string/);
    }
  });

  it("#26: any separator works", () => {
    expect(slugify("Jioni Jazz Night", { separator: "." })).toBe("jioni.jazz.night");
    expect(slugify("Jioni Jazz Night", { separator: "" })).toBe("jionijazznight");
    expect(slugify("Jioni 🎷 Jazz", { separator: "_" })).toBe("jioni_jazz");
    expect(slugify("Jioni Jazz Night", { separator: "--", maxLength: 12 })).toBe("jioni--jazz");
  });

  it("#21 isn't a bug: lowercase: false still keeps capitals, as documented", () => {
    expect(slugify("Ünïcödé Party", { lowercase: false })).toBe("Unicode-Party");
  });
});

describe("nothing that worked has changed", () => {
  // Made by slugo 2.3.1: every one of these is somebody's URL.
  const before: [string, string, string][] = [
    ["Jioni Jazz Night", "jioni-jazz-night", "jioni-jazz"],
    ["Sauti za Pwani 2026", "sauti-za-pwani-2026", "sauti-za"],
    ["Nairobi Comedy Store: Live!", "nairobi-comedy-store-live", "nairobi"],
    ["Café Ngoma", "cafe-ngoma", "cafe-ngoma"],
    ["Mũthoni's Birthday Bash", "muthonis-birthday-bash", "muthonis"],
    ["Rock & Roll @ Uhuru Gardens", "rock-and-roll-at-uhuru-gardens", "rock-and"],
    ["Straße der Musik", "strasse-der-musik", "strasse-der"],
    ["Ærøskøbing Folk Festival", "aeroskobing-folk-festival", "aeroskobing"],
    ["The Best of Benga (Vol. 3)", "the-best-of-benga-vol-3", "the-best-of"],
    ["  Kilifi   New Year  ", "kilifi-new-year", "kilifi-new"],
    ["100% Afrobeats", "100-afrobeats", "100"],
    ["Q&A with the Band", "q-and-a-with-the-band", "q-and-a-with"],
    ["Hip-Hop Night", "hip-hop-night", "hip-hop"],
    ["Jazz, Wine, and Sunsets", "jazz-wine-and-sunsets", "jazz-wine"],
  ];

  it.each(before)("%s", (title, slug, short) => {
    expect(slugify(title)).toBe(slug);
    expect(slugify(title, { maxLength: 12 })).toBe(short);
    expect(slugify(title, { lowercase: false }).toLowerCase()).toBe(slug);
  });

  it("still hard-cuts one word that's longer than maxLength (#9)", () => {
    expect(slugify("Supercalifragilistic Night", { maxLength: 5 })).toBe("super");
  });
});

describe("the contribution", () => {
  const fixed = [12, 15, 19, 23, 24, 26];

  it("adds a failing-first test for each bug to the library's own tests", () => {
    const tests = read("slugo/test/slugify.test.ts");
    for (const n of [12, 15, 19, 23, 26]) expect(tests, `a test mentioning #${n}`).toContain(`#${n}`);
  });

  it("adds each fix to the changelog, under Unreleased", () => {
    const changelog = read("slugo/CHANGELOG.md");
    const unreleased = changelog.slice(changelog.indexOf("## Unreleased"), changelog.indexOf("## 2.3.1"));
    for (const n of [12, 15, 19, 23, 26]) expect(unreleased, `#${n} in Unreleased`).toMatch(new RegExp(`^- .*#${n}\\b`, "m"));
    expect(unreleased).not.toContain("#21");
    expect(changelog).toContain("## 2.3.1\n\n- `maxLength` no longer cuts a word in half"); // history untouched
  });

  it("closes the fixed issues from the pull request, and nothing else", () => {
    const pr = read("PULL_REQUEST.md");
    expect(pr).not.toContain("TODO");
    for (const n of fixed) expect(pr, `Fixes #${n}`).toMatch(new RegExp(`\\b(Fixes|Closes|Resolves) #${n}\\b`, "i"));
    expect(pr).not.toMatch(/\b(Fixes|Closes|Resolves) #21\b/i);
    expect(pr.length).toBeGreaterThan(600); // says what was wrong, why, and how
  });

  it("answers the issue that isn't a bug, and points the duplicate at the original", () => {
    const replies = read("REPLIES.md");
    expect(replies).not.toContain("TODO");
    const section = (n: number) => replies.split(/^## /m).find((s) => s.startsWith(`#${n}`)) ?? "";
    expect(section(21)).toMatch(/lowercase/);
    expect(section(24)).toContain("#12");
  });
});
