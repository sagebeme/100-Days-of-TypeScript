// The rules of the race, with no DOM: the tests are the spec.

export type CharState = "correct" | "wrong" | "pending";

export interface Keystroke {
  at: number; // ms since the race started
  key: string; // a character, or "Backspace"
}

export interface RaceState {
  target: string;
  typed: string;
  keystrokes: Keystroke[];
  startedAt: number | null;
  finishedAt: number | null;
}

export type RaceAction = { type: "key"; key: string; now: number } | { type: "reset"; target: string };

export interface Stats {
  wpm: number;
  rawWpm: number;
  accuracy: number; // 0 to 100
  errors: number;
  seconds: number;
}

export function compare(target: string, typed: string): { states: CharState[]; extra: string } {
  throw new Error(`TODO: compare(${target}, ${typed})`);
}

export function newRace(target: string): RaceState {
  return { target, typed: "", keystrokes: [], startedAt: null, finishedAt: null };
}

export function raceReducer(state: RaceState, action: RaceAction): RaceState {
  throw new Error(`TODO: raceReducer(${state.typed}, ${action.type})`);
}

export function stats(state: RaceState, now: number): Stats {
  throw new Error(`TODO: stats(${state.typed}, ${now})`);
}

export function ghostProgress(keystrokes: Keystroke[], target: string, ms: number): number {
  throw new Error(`TODO: ghostProgress(${keystrokes.length}, ${target}, ${ms})`);
}

export function progress(state: RaceState): number {
  throw new Error(`TODO: progress(${state.typed})`);
}

export function isNewBest(run: Stats, best: Stats | null): boolean {
  throw new Error(`TODO: isNewBest(${run.wpm}, ${best?.wpm})`);
}

export const PASSAGES = [
  "The matatu swung round the corner at Kencom, bass shaking the windows, and the conductor leaned out to shout the fare to anyone who would listen.",
  "Nyama choma tastes best on a Saturday afternoon, with friends, a plate of kachumbari, and nobody in any hurry to go home.",
  "She checked the time, counted the notes in her hand twice, and ran for the last bus to Rongai as the rain began to fall.",
  "At the gate, the ticket scanner beeped green, the crowd cheered, and the first notes of the band drifted over the gardens.",
  "Every morning the market wakes before the sun: crates of mangoes, stacks of sukuma, and the smell of fresh mandazi in the air.",
];

export function passageFor(date: Date): string {
  throw new Error(`TODO: passageFor(${date.toISOString()})`);
}
