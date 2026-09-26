import { describe, it, expect } from "vitest";
import { compare, newRace, raceReducer, stats, ghostProgress, progress, isNewBest, passageFor, PASSAGES, type RaceState } from "./starter/race.ts";

// Type a string into a race, one key every `gap` ms, starting at `start`.
function typeInto(state: RaceState, keys: string[], start = 1000, gap = 200): RaceState {
  return keys.reduce((s, key, i) => raceReducer(s, { type: "key", key, now: start + i * gap }), state);
}
const chars = (text: string) => [...text];

describe("comparing what's typed with the passage", () => {
  it("marks each character right, wrong or not yet typed, and anything past the end as extra", () => {
    expect(compare("habari", "hab")).toEqual({ states: ["correct", "correct", "correct", "pending", "pending", "pending"], extra: "" });
    expect(compare("habari", "hxbari!!")).toEqual({ states: ["correct", "wrong", "correct", "correct", "correct", "correct"], extra: "!!" });
  });
});

describe("the race", () => {
  it("starts the clock on the first key, not before", () => {
    const race = newRace("sawa");
    expect(race.startedAt).toBeNull();
    const started = raceReducer(race, { type: "key", key: "s", now: 5000 });
    expect(started.startedAt).toBe(5000);
    expect(started.keystrokes).toEqual([{ at: 0, key: "s" }]);
  });

  it("finishes the moment the passage is typed exactly, and ignores keys after that", () => {
    const done = typeInto(newRace("sawa"), chars("sawa"));
    expect(done.finishedAt).toBe(1600);
    expect(typeInto(done, ["x"]).typed).toBe("sawa");
  });

  it("needs mistakes fixed to finish", () => {
    const wrong = typeInto(newRace("sawa"), chars("sawx"));
    expect(wrong.finishedAt).toBeNull();
    const fixed = typeInto(wrong, ["Backspace", "a"], 2000);
    expect(fixed.typed).toBe("sawa");
    expect(fixed.finishedAt).toBe(2200);
  });

  it("ignores keys that don't type anything, and doesn't let you type forever past the end", () => {
    const race = typeInto(newRace("ok"), ["Shift", "ArrowLeft", "o"]);
    expect(race.typed).toBe("o");
    expect(race.keystrokes).toHaveLength(1);
    expect(typeInto(newRace("ok"), chars("xy".repeat(20))).typed).toHaveLength(12); // at most 10 past the end
  });

  it("starts over", () => {
    expect(raceReducer(typeInto(newRace("sawa"), chars("sa")), { type: "reset", target: "poa" })).toEqual(newRace("poa"));
  });
});

describe("stats", () => {
  it("measures words per minute as correct characters ÷ 5 per minute", () => {
    // 25 correct characters in 12 seconds: 5 words in a fifth of a minute is 25 wpm.
    const text = "a".repeat(25);
    const race = typeInto(newRace(text), chars(text), 0, 500);
    expect(stats(race, 99_999)).toMatchObject({ wpm: 25, rawWpm: 25, accuracy: 100, errors: 0, seconds: 12 });
  });

  it("counts every wrong key press against accuracy, even ones that were fixed", () => {
    const race = typeInto(newRace("abcd"), ["a", "x", "Backspace", "b", "c", "d"]);
    expect(stats(race, 0)).toMatchObject({ accuracy: 80, errors: 1 }); // 4 right out of 5 typed
  });

  it("uses the clock while the race is running", () => {
    const race = typeInto(newRace("abcdefghij"), chars("abcde"), 0, 1000); // 5 correct, started at 0
    expect(stats(race, 10_000).seconds).toBe(10);
    expect(stats(race, 10_000).wpm).toBe(6); // 1 word in 10 seconds
  });

  it("is all zeros before the race starts", () => {
    expect(stats(newRace("abc"), 5000)).toEqual({ wpm: 0, rawWpm: 0, accuracy: 100, errors: 0, seconds: 0 });
  });
});

describe("progress and the ghost", () => {
  it("counts only the correct start of the passage as progress", () => {
    expect(progress(typeInto(newRace("abcd"), chars("ab")))).toBe(0.5);
    expect(progress(typeInto(newRace("abcd"), chars("axcd")))).toBe(0.25);
  });

  it("replays a best run to show where it was at any moment", () => {
    const best = typeInto(newRace("abcd"), ["a", "b", "x", "Backspace", "c", "d"], 0, 100).keystrokes;
    expect(ghostProgress(best, "abcd", 0)).toBe(0.25);
    expect(ghostProgress(best, "abcd", 250)).toBe(0.5); // "abx": only "ab" counts
    expect(ghostProgress(best, "abcd", 400)).toBe(0.75);
    expect(ghostProgress(best, "abcd", 10_000)).toBe(1);
  });

  it("only counts a faster run as a new best when it's at least 90% accurate", () => {
    const run = (wpm: number, accuracy: number) => ({ wpm, rawWpm: wpm, accuracy, errors: 0, seconds: 10 });
    expect(isNewBest(run(50, 95), null)).toBe(true);
    expect(isNewBest(run(60, 95), run(55, 99))).toBe(true);
    expect(isNewBest(run(50, 95), run(55, 99))).toBe(false);
    expect(isNewBest(run(90, 80), run(55, 99))).toBe(false);
  });
});

describe("passages", () => {
  it("gives everyone the same passage on the same day, and a different one the next", () => {
    const today = passageFor(new Date("2026-12-05T08:00:00Z"));
    expect(passageFor(new Date("2026-12-05T20:00:00Z"))).toBe(today);
    expect(passageFor(new Date("2026-12-06T08:00:00Z"))).not.toBe(today);
    expect(PASSAGES).toContain(today);
  });
});
