// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  addDays,
  review,
  dueCards,
  learnedCount,
  loadProgress,
  saveProgress,
  type Card,
  type ProgressMap,
} from "./starter/deck.ts";
import { mountFlashcards } from "./starter/app.ts";

const html = readFileSync(join(import.meta.dirname, "starter", "index.html"), "utf8");
const TODAY = "2026-10-01";
const KEY = "flashcards-test";

const cards: Card[] = [
  { id: "maji", sw: "maji", en: "water" },
  { id: "rafiki", sw: "rafiki", en: "friend" },
  { id: "kesho", sw: "kesho", en: "tomorrow" },
  { id: "pesa", sw: "pesa", en: "money" },
];

describe("addDays", () => {
  it.each([
    ["2026-10-01", 1, "2026-10-02"],
    ["2026-10-01", 7, "2026-10-08"],
    ["2026-12-30", 3, "2027-01-02"],
    ["2026-10-01", 0, "2026-10-01"],
  ])("%s + %i days is %s", (day, days, expected) => {
    expect(addDays(day, days)).toBe(expected);
  });
});

describe("review", () => {
  it("puts a new card in box 1, due tomorrow, when it's right", () => {
    expect(review({}, "maji", true, TODAY)).toEqual({ maji: { box: 1, due: "2026-10-02" } });
  });

  it("moves a right card up a box and spaces it out more", () => {
    expect(review({ maji: { box: 1, due: TODAY } }, "maji", true, TODAY).maji).toEqual({ box: 2, due: "2026-10-04" });
    expect(review({ maji: { box: 2, due: TODAY } }, "maji", true, TODAY).maji).toEqual({ box: 3, due: "2026-10-08" });
  });

  it("never goes above the top box", () => {
    expect(review({ maji: { box: 3, due: TODAY } }, "maji", true, TODAY).maji).toEqual({ box: 3, due: "2026-10-08" });
  });

  it("sends a wrong card back to box 1, due today", () => {
    expect(review({ maji: { box: 3, due: TODAY } }, "maji", false, TODAY).maji).toEqual({ box: 1, due: TODAY });
  });

  it("leaves the other cards alone and does not change the map it was given", () => {
    const before: ProgressMap = { rafiki: { box: 2, due: "2026-10-09" } };
    const after = review(before, "maji", true, TODAY);
    expect(after.rafiki).toEqual({ box: 2, due: "2026-10-09" });
    expect(before).toEqual({ rafiki: { box: 2, due: "2026-10-09" } });
  });
});

describe("dueCards", () => {
  it("gives every card when nothing has been studied", () => {
    expect(dueCards(cards, {}, TODAY)).toEqual(cards);
  });

  it("puts due cards first, lowest box first, then new cards, and skips cards due later", () => {
    const progress: ProgressMap = {
      maji: { box: 3, due: "2026-09-30" },
      rafiki: { box: 1, due: TODAY },
      kesho: { box: 2, due: "2026-10-05" },
    };
    expect(dueCards(cards, progress, TODAY).map((c) => c.id)).toEqual(["rafiki", "maji", "pesa"]);
  });
});

describe("learnedCount", () => {
  it("counts the cards in the top box", () => {
    expect(learnedCount({})).toBe(0);
    expect(
      learnedCount({ maji: { box: 3, due: TODAY }, rafiki: { box: 2, due: TODAY }, pesa: { box: 3, due: TODAY } }),
    ).toBe(2);
  });
});

describe("loadProgress and saveProgress", () => {
  beforeEach(() => localStorage.clear());

  it("saves as JSON and loads it back", () => {
    const progress: ProgressMap = { maji: { box: 2, due: "2026-10-04" } };
    expect(saveProgress(localStorage, KEY, progress)).toBe(true);
    expect(JSON.parse(localStorage.getItem(KEY) ?? "")).toEqual(progress);
    expect(loadProgress(localStorage, KEY)).toEqual(progress);
  });

  it("gives {} when nothing is saved yet", () => {
    expect(loadProgress(localStorage, KEY)).toEqual({});
  });

  it.each([
    ["broken JSON", "{not json"],
    ["an array", "[1, 2]"],
    ["a number", "42"],
    ["null", "null"],
  ])("gives {} for %s", (_label, stored) => {
    localStorage.setItem(KEY, stored);
    expect(loadProgress(localStorage, KEY)).toEqual({});
  });

  it("drops entries that don't look right and keeps the rest", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        maji: { box: 2, due: "2026-10-04" },
        rafiki: { box: 9, due: "2026-10-04" },
        kesho: { box: 1.5, due: "2026-10-04" },
        pesa: { box: 1 },
        leo: "box 1",
      }),
    );
    expect(loadProgress(localStorage, KEY)).toEqual({ maji: { box: 2, due: "2026-10-04" } });
  });

  it("survives storage that throws", () => {
    const broken = {
      getItem: (): string | null => {
        throw new Error("SecurityError");
      },
      setItem: (): void => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(loadProgress(broken, KEY)).toEqual({});
    expect(saveProgress(broken, KEY, {})).toBe(false);
  });
});

describe("mountFlashcards", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = new DOMParser().parseFromString(html, "text/html").body.innerHTML;
  });

  const el = (selector: string) => document.querySelector<HTMLElement>(selector)!;
  const click = (selector: string) => el(selector).click();
  const mount = () => mountFlashcards(document, { cards, storage: localStorage, storageKey: KEY, today: TODAY });

  it("shows the first card with the answer hidden", () => {
    mount();
    expect(el("#prompt").textContent).toBe("maji");
    expect(el("#answer").hidden).toBe(true);
    expect(el("#reveal").hidden).toBe(false);
    expect(el("#grade").hidden).toBe(true);
    expect(el("#stats").textContent).toBe("4 left · 0 learned");
  });

  it("reveals the answer and the grade buttons", () => {
    mount();
    click("#reveal");
    expect(el("#answer").hidden).toBe(false);
    expect(el("#answer").textContent).toBe("water");
    expect(el("#grade").hidden).toBe(false);
    expect(el("#reveal").hidden).toBe(true);
  });

  it("moves on after a right answer and saves the progress", () => {
    mount();
    click("#reveal");
    click("#right");
    expect(el("#prompt").textContent).toBe("rafiki");
    expect(el("#answer").hidden).toBe(true);
    expect(el("#stats").textContent).toBe("3 left · 0 learned");
    expect(loadProgress(localStorage, KEY)).toEqual({ maji: { box: 1, due: "2026-10-02" } });
  });

  it("brings a missed card back at the end of the session", () => {
    mount();
    click("#reveal");
    click("#wrong");
    expect(el("#stats").textContent).toBe("4 left · 0 learned");
    for (let i = 0; i < 3; i++) {
      click("#reveal");
      click("#right");
    }
    expect(el("#prompt").textContent).toBe("maji");
  });

  it("says when you're done and hides the buttons", () => {
    mount();
    for (let i = 0; i < cards.length; i++) {
      click("#reveal");
      click("#right");
    }
    expect(el("#prompt").textContent).toBe("Umemaliza! Come back tomorrow.");
    expect(el("#reveal").hidden).toBe(true);
    expect(el("#grade").hidden).toBe(true);
    expect(el("#answer").hidden).toBe(true);
    expect(el("#stats").textContent).toBe("0 left · 0 learned");
  });

  it("remembers you: tomorrow only the cards that are due come back", () => {
    saveProgress(localStorage, KEY, {
      maji: { box: 3, due: "2026-10-08" },
      rafiki: { box: 1, due: TODAY },
      kesho: { box: 3, due: "2026-10-09" },
    });
    mount();
    expect(el("#prompt").textContent).toBe("rafiki");
    expect(el("#stats").textContent).toBe("2 left · 2 learned");
  });
});
