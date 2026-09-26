// The rules of Neno. The tests are the spec.
export type Mark = "correct" | "present" | "absent";
export const LENGTH = 5;
export const TRIES = 6;

export interface Game {
  answer: string;
  guesses: string[];
  current: string;
  status: "playing" | "won" | "lost";
  message: string | null;
}

export type GameAction = { type: "letter"; letter: string } | { type: "back" } | { type: "enter" };

export interface Stats {
  played: number;
  won: number;
  streak: number;
  best: number;
  lastPuzzle: number | null;
  spread: number[]; // wins in 1, 2 … 6 guesses
}

export function newGame(answer: string): Game {
  return { answer, guesses: [], current: "", status: "playing", message: null };
}

export const noStats = (): Stats => ({ played: 0, won: 0, streak: 0, best: 0, lastPuzzle: null, spread: [0, 0, 0, 0, 0, 0] });

export function score(guess: string, answer: string): Mark[] {
  throw new Error(`TODO: score(${guess}, ${answer})`);
}

export function keyboard(guesses: string[], answer: string): Record<string, Mark> {
  throw new Error(`TODO: keyboard(${guesses.length}, ${answer})`);
}

export function play(game: Game, action: GameAction): Game {
  throw new Error(`TODO: play(${game.current}, ${action.type})`);
}

export function puzzleNumber(now: Date): number {
  throw new Error(`TODO: puzzleNumber(${now.toISOString()})`);
}

export function answerFor(puzzle: number): string {
  throw new Error(`TODO: answerFor(${puzzle})`);
}

export function shareText(game: Game, puzzle: number): string {
  throw new Error(`TODO: shareText(${game.answer}, ${puzzle})`);
}

export function record(stats: Stats, game: Game, puzzle: number): Stats {
  throw new Error(`TODO: record(${stats.played}, ${game.status}, ${puzzle})`);
}
