import { ANSWERS, WORDS } from "./words.ts";

export type Mark = "correct" | "present" | "absent";
export const LENGTH = 5;
export const TRIES = 6;

// Green, yellow or grey for each letter. Two passes, so repeated letters are counted fairly: first
// the letters in the right place, then the rest, each using up one of that letter in the answer.
// Guessing "mtoto" for "mboga": the first o is yellow, the second grey (mboga has only one o left).
export function score(guess: string, answer: string): Mark[] {
  const marks: Mark[] = new Array(LENGTH).fill("absent");
  const left = new Map<string, number>();
  for (let i = 0; i < LENGTH; i++) {
    if (guess[i] === answer[i]) marks[i] = "correct";
    else left.set(answer[i], (left.get(answer[i]) ?? 0) + 1);
  }
  for (let i = 0; i < LENGTH; i++) {
    if (marks[i] === "correct") continue;
    const n = left.get(guess[i]) ?? 0;
    if (n > 0) {
      marks[i] = "present";
      left.set(guess[i], n - 1);
    }
  }
  return marks;
}

// The best thing known about each letter so far, for colouring the keyboard: green beats yellow beats grey.
export function keyboard(guesses: string[], answer: string): Record<string, Mark> {
  const rank: Record<Mark, number> = { absent: 0, present: 1, correct: 2 };
  const keys: Record<string, Mark> = {};
  for (const guess of guesses) {
    score(guess, answer).forEach((mark, i) => {
      const letter = guess[i];
      if (!keys[letter] || rank[mark] > rank[keys[letter]]) keys[letter] = mark;
    });
  }
  return keys;
}

export interface Game {
  answer: string;
  guesses: string[];
  current: string;
  status: "playing" | "won" | "lost";
  message: string | null; // for the player, in Kiswahili and English
}

export type GameAction = { type: "letter"; letter: string } | { type: "back" } | { type: "enter" };

export function newGame(answer: string): Game {
  return { answer, guesses: [], current: "", status: "playing", message: null };
}

const WIN_WORDS = ["Hodari! Genius!", "Safi sana! Brilliant!", "Vizuri! Great!", "Nzuri! Nice!", "Sawa! Good!", "Phew! Just in time!"];

export function play(game: Game, action: GameAction): Game {
  if (game.status !== "playing") return game;
  if (action.type === "letter") {
    const letter = action.letter.toLowerCase();
    if (!/^[a-z]$/.test(letter) || game.current.length >= LENGTH) return game;
    return { ...game, current: game.current + letter, message: null };
  }
  if (action.type === "back") return { ...game, current: game.current.slice(0, -1), message: null };
  if (game.current.length < LENGTH) return { ...game, message: "Herufi hazitoshi · Not enough letters" };
  if (!WORDS.has(game.current)) return { ...game, message: "Si neno tunalolijua · Not in the word list" };
  const guesses = [...game.guesses, game.current];
  if (game.current === game.answer) return { ...game, guesses, current: "", status: "won", message: WIN_WORDS[guesses.length - 1] };
  if (guesses.length === TRIES) return { ...game, guesses, current: "", status: "lost", message: `Pole! The word was ${game.answer.toUpperCase()}` };
  return { ...game, guesses, current: "", message: null };
}

// Everyone gets the same word on the same day, counted in Nairobi. The list is shuffled once with a
// fixed seed, so the order isn't alphabetical, but it's the same for everybody.
const START = Date.UTC(2026, 0, 1); // puzzle 1 was 1 January 2026
export function puzzleNumber(now: Date): number {
  const nairobiMidnight = Math.floor((now.getTime() + 3 * 3_600_000) / 86_400_000) * 86_400_000;
  return Math.floor((nairobiMidnight - START) / 86_400_000) + 1;
}

export function answerFor(puzzle: number): string {
  const words = Object.keys(ANSWERS).sort();
  let seed = 92;
  const shuffled = words.map((w) => {
    seed = (seed * 1103515245 + 12345) % 2 ** 31;
    return { w, k: seed };
  });
  shuffled.sort((a, b) => a.k - b.k);
  const n = shuffled.length;
  return shuffled[(((puzzle - 1) % n) + n) % n].w;
}

// The grid of squares people paste into WhatsApp: no letters, so it spoils nothing.
export function shareText(game: Game, puzzle: number): string {
  const squares: Record<Mark, string> = { correct: "🟩", present: "🟨", absent: "⬜" };
  const rows = game.guesses.map((g) => score(g, game.answer).map((m) => squares[m]).join(""));
  return `Neno #${puzzle} ${game.status === "won" ? game.guesses.length : "X"}/${TRIES}\n\n${rows.join("\n")}`;
}

export interface Stats {
  played: number;
  won: number;
  streak: number;
  best: number;
  lastPuzzle: number | null;
  spread: number[]; // wins in 1, 2 … 6 guesses
}

export const noStats = (): Stats => ({ played: 0, won: 0, streak: 0, best: 0, lastPuzzle: null, spread: [0, 0, 0, 0, 0, 0] });

// After a finished game. A streak needs yesterday's puzzle won too; the same puzzle never counts twice.
export function record(stats: Stats, game: Game, puzzle: number): Stats {
  if (game.status === "playing" || stats.lastPuzzle === puzzle) return stats;
  const won = game.status === "won";
  const streak = won ? (stats.lastPuzzle === puzzle - 1 ? stats.streak + 1 : 1) : 0;
  const spread = [...stats.spread];
  if (won) spread[game.guesses.length - 1]++;
  return { played: stats.played + 1, won: stats.won + (won ? 1 : 0), streak, best: Math.max(stats.best, streak), lastPuzzle: puzzle, spread };
}
