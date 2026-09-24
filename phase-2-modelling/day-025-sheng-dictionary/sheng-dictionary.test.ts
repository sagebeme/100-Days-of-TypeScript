import { describe, it, expect } from "vitest";
import { lookup, addEntry, search, wordOfTheDay, type Entry } from "./starter/sheng-dictionary.ts";

const entries: Entry[] = [
  { word: "poa", meaning: "cool, fine, all good" },
  { word: "mtaa", meaning: "the neighbourhood you're from" },
  { word: "mbogi", meaning: "a group of friends" },
  { word: "ganji", meaning: "money" },
  { word: "form", meaning: "a plan or an idea" },
];

describe("step 1: lookup", () => {
  it("finds an entry by its word", () => {
    expect(lookup(entries, "ganji")).toEqual({ word: "ganji", meaning: "money" });
  });

  it("ignores case and spaces around the word", () => {
    expect(lookup(entries, "  POA ")?.meaning).toBe("cool, fine, all good");
  });

  it("returns undefined for a word that isn't there", () => {
    expect(lookup(entries, "kitu")).toBeUndefined();
  });
});

describe("step 2: addEntry", () => {
  it("returns a new array with the entry added at the end", () => {
    const updated = addEntry(entries, { word: "chapaa", meaning: "money (coins)" });
    expect(updated).toHaveLength(6);
    expect(updated[5].word).toBe("chapaa");
  });

  it("does not change the array it was given", () => {
    addEntry(entries, { word: "chapaa", meaning: "money (coins)" });
    expect(entries).toHaveLength(5);
  });

  it("refuses a word that is already there, ignoring case", () => {
    expect(() => addEntry(entries, { word: "Poa", meaning: "again" })).toThrow('"Poa" is already in the dictionary');
  });
});

describe("step 3: search", () => {
  it("matches on the word", () => {
    expect(search(entries, "mb").map((e) => e.word)).toEqual(["mbogi"]);
  });

  it("matches on the meaning", () => {
    expect(search(entries, "money").map((e) => e.word)).toEqual(["ganji"]);
  });

  it("ignores case", () => {
    expect(search(entries, "GROUP").map((e) => e.word)).toEqual(["mbogi"]);
  });

  it("sorts results by word", () => {
    expect(search(entries, "a").map((e) => e.word)).toEqual(["form", "ganji", "mbogi", "mtaa", "poa"]);
  });

  it("returns nothing for an empty or blank query", () => {
    expect(search(entries, "")).toEqual([]);
    expect(search(entries, "   ")).toEqual([]);
  });

  it("does not reorder the array it was given", () => {
    search(entries, "a");
    expect(entries.map((e) => e.word)).toEqual(["poa", "mtaa", "mbogi", "ganji", "form"]);
  });
});

describe("step 4: wordOfTheDay", () => {
  it("picks from the entries sorted by word", () => {
    expect(wordOfTheDay(entries, 0).word).toBe("form");
    expect(wordOfTheDay(entries, 2).word).toBe("mbogi");
  });

  it("wraps around when the day number is bigger than the dictionary", () => {
    expect(wordOfTheDay(entries, 7).word).toBe("mbogi");
    expect(wordOfTheDay(entries, 364).word).toBe("poa");
  });

  it("throws for an empty dictionary", () => {
    expect(() => wordOfTheDay([], 10)).toThrow("Dictionary is empty");
  });
});
