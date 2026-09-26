import { describe, it, expect } from "vitest";
import { score, keyboard, newGame, play, puzzleNumber, answerFor, shareText, record, noStats, type Game, type GameAction } from "./starter/wordle.ts";
import { ANSWERS, WORDS } from "./starter/words.ts";

const typeWord = (game: Game, word: string): Game => [...word].reduce((g, letter) => play(g, { type: "letter", letter }), game);
const guess = (game: Game, word: string): Game => play(typeWord(game, word), { type: "enter" });

describe("scoring a guess", () => {
  it("marks letters in the right place, in the word, or not in it", () => {
    expect(score("simba", "simba")).toEqual(["correct", "correct", "correct", "correct", "correct"]);
    expect(score("tunda", "nyoka")).toEqual(["absent", "absent", "present", "absent", "correct"]);
  });

  it("counts repeated letters fairly: each letter in the answer is used once", () => {
    // tumbo has one o (the last letter: green), so mtoto's first o is grey; one t, so only the first t is yellow.
    expect(score("mtoto", "tumbo")).toEqual(["present", "present", "absent", "absent", "correct"]);
    expect(score("ndoto", "tembo")).toEqual(["absent", "absent", "absent", "present", "correct"]);
    expect(score("papai", "punda")).toEqual(["correct", "present", "absent", "absent", "absent"]);
    expect(score("mdudu", "mtoto")).toEqual(["correct", "absent", "absent", "absent", "absent"]);
  });
});

describe("the keyboard", () => {
  it("shows the best thing known about each letter: green beats yellow beats grey", () => {
    const keys = keyboard(["tunda", "nyama"], "nyoka");
    expect(keys.n).toBe("correct"); // yellow in tunda, green in nyama
    expect(keys.a).toBe("correct");
    expect(keys.t).toBe("absent");
    expect(keys.q).toBeUndefined();
  });
});

describe("playing", () => {
  it("types up to five letters, and deletes", () => {
    const g = play(typeWord(newGame("nyoka"), "simbaz"), { type: "back" });
    expect(g.current).toBe("simb");
    expect(play(g, { type: "letter", letter: "1" }).current).toBe("simb");
    expect(play(g, { type: "letter", letter: "A" }).current).toBe("simba");
  });

  it("explains a guess it won't take, in Kiswahili and English, without using a turn", () => {
    const short = play(typeWord(newGame("nyoka"), "sim"), { type: "enter" });
    expect([short.message, short.guesses.length]).toEqual(["Herufi hazitoshi · Not enough letters", 0]);
    const unknown = guess(newGame("nyoka"), "xyzzy");
    expect([unknown.message, unknown.guesses.length, unknown.current]).toEqual(["Si neno tunalolijua · Not in the word list", 0, "xyzzy"]);
  });

  it("wins with the answer, and cheers by how quick it was", () => {
    const g = guess(guess(newGame("nyoka"), "simba"), "nyoka");
    expect(g).toMatchObject({ status: "won", guesses: ["simba", "nyoka"], message: "Safi sana! Brilliant!" });
    expect(play(g, { type: "letter", letter: "a" })).toBe(g); // nothing more after the end
  });

  it("loses after six wrong guesses, and says the word", () => {
    const g = ["simba", "tembo", "shule", "barua", "ndizi", "wimbo"].reduce(guess, newGame("nyoka"));
    expect(g).toMatchObject({ status: "lost", message: "Pole! The word was NYOKA" });
  });
});

describe("the daily word", () => {
  it("is the same for everyone all day in Nairobi, and changes at midnight there", () => {
    expect(puzzleNumber(new Date("2026-01-01T00:00:00+03:00"))).toBe(1);
    expect(puzzleNumber(new Date("2026-12-05T23:59:00+03:00"))).toBe(puzzleNumber(new Date("2026-12-05T00:01:00+03:00")));
    expect(puzzleNumber(new Date("2026-12-05T21:00:00Z"))).toBe(puzzleNumber(new Date("2026-12-05T00:01:00+03:00")) + 1); // midnight in Nairobi
  });

  it("is always one of the answers, in a fixed but not alphabetical order", () => {
    const words = Array.from({ length: Object.keys(ANSWERS).length }, (_, i) => answerFor(i + 1));
    expect(new Set(words).size).toBe(words.length); // every word once before any repeats
    expect(words).not.toEqual([...words].sort());
    expect(answerFor(1 + words.length)).toBe(words[0]);
    for (const w of words) expect(WORDS.has(w)).toBe(true);
  });

  it("has only five-letter words, each with a meaning", () => {
    for (const [word, meaning] of Object.entries(ANSWERS)) {
      expect(word).toMatch(/^[a-z]{5}$/);
      expect(meaning.length).toBeGreaterThan(2);
    }
  });
});

describe("sharing and stats", () => {
  it("shares coloured squares, never the letters", () => {
    const g = guess(guess(newGame("nyoka"), "tunda"), "nyoka");
    expect(shareText(g, 42)).toBe("Neno #42 2/6\n\n⬜⬜🟨⬜🟩\n🟩🟩🟩🟩🟩");
    const lost = ["simba", "tembo", "shule", "barua", "ndizi", "wimbo"].reduce(guess, newGame("nyoka"));
    expect(shareText(lost, 42)).toMatch(/^Neno #42 X\/6/);
  });

  it("counts games, wins, streaks and how many guesses each win took", () => {
    const win = (n: number) => ({ ...newGame("nyoka"), status: "won" as const, guesses: Array(n).fill("nyoka") });
    let stats = record(noStats(), win(3), 10);
    stats = record(stats, win(4), 11);
    expect(stats).toMatchObject({ played: 2, won: 2, streak: 2, best: 2, spread: [0, 0, 1, 1, 0, 0] });
    stats = record(stats, win(4), 11);
    expect(stats.played).toBe(2); // the same puzzle never counts twice
    stats = record(stats, { ...newGame("nyoka"), status: "lost" }, 12);
    expect(stats).toMatchObject({ played: 3, won: 2, streak: 0, best: 2 });
    expect(record(stats, win(2), 14).streak).toBe(1); // missed a day: a new streak
  });

  it("ignores a game that isn't finished", () => {
    const action: GameAction = { type: "letter", letter: "a" };
    expect(record(noStats(), play(newGame("nyoka"), action), 1)).toEqual(noStats());
  });
});
