// The rules of a typing race, with no DOM in sight: easy to test, and the page just draws them.

export type CharState = "correct" | "wrong" | "pending";

// What each character of the passage looks like, given what's been typed so far. Anything typed past
// the end is "extra", shown as mistakes.
export function compare(target: string, typed: string): { states: CharState[]; extra: string } {
  const states = [...target].map((char, i): CharState => (i >= typed.length ? "pending" : typed[i] === char ? "correct" : "wrong"));
  return { states, extra: typed.slice(target.length) };
}

export interface Keystroke {
  at: number; // ms since the race started
  key: string; // a character, or "Backspace"
}

export interface RaceState {
  target: string;
  typed: string;
  keystrokes: Keystroke[];
  startedAt: number | null; // the clock time of the first key
  finishedAt: number | null;
}

export type RaceAction = { type: "key"; key: string; now: number } | { type: "reset"; target: string };

export function newRace(target: string): RaceState {
  return { target, typed: "", keystrokes: [], startedAt: null, finishedAt: null };
}

// The clock starts on the first key, not when the page loads. The race ends the moment the passage
// is typed exactly; after that, keys do nothing. Mistakes must be fixed to finish.
export function raceReducer(state: RaceState, action: RaceAction): RaceState {
  if (action.type === "reset") return newRace(action.target);
  if (state.finishedAt !== null) return state;
  const { key, now } = action;
  if (key !== "Backspace" && [...key].length !== 1) return state; // Shift, arrows and friends
  const startedAt = state.startedAt ?? now;
  const typed = key === "Backspace" ? state.typed.slice(0, -1) : state.typed.length >= state.target.length + 10 ? state.typed : state.typed + key;
  const keystrokes = [...state.keystrokes, { at: now - startedAt, key }];
  return { ...state, typed, keystrokes, startedAt, finishedAt: typed === state.target ? now : null };
}

export interface Stats {
  wpm: number; // correct characters ÷ 5, per minute: the usual definition of a "word"
  rawWpm: number; // every character typed, right or wrong
  accuracy: number; // % of key presses that were right the first time, 0 to 100
  errors: number; // key presses that typed a wrong character
  seconds: number;
}

export function stats(state: RaceState, now: number): Stats {
  const end = state.finishedAt ?? now;
  const ms = state.startedAt === null ? 0 : Math.max(end - state.startedAt, 1);
  const minutes = ms / 60_000;
  const correct = compare(state.target, state.typed).states.filter((s) => s === "correct").length;

  // Replay the key presses to judge each one when it happened, not by how things ended up.
  let text = "";
  let good = 0;
  let errors = 0;
  let typedChars = 0;
  for (const { key } of state.keystrokes) {
    if (key === "Backspace") {
      text = text.slice(0, -1);
      continue;
    }
    typedChars++;
    if (state.target[text.length] === key) good++;
    else errors++;
    text += key;
  }
  const round = (n: number) => Math.round(n * 10) / 10;
  return {
    wpm: minutes === 0 ? 0 : round(correct / 5 / minutes),
    rawWpm: minutes === 0 ? 0 : round(typedChars / 5 / minutes),
    accuracy: typedChars === 0 ? 100 : round((good / typedChars) * 100),
    errors,
    seconds: round(ms / 1000),
  };
}

// A ghost: your best run, replayed. How far along it was this many ms into its race.
export function ghostProgress(keystrokes: Keystroke[], target: string, ms: number): number {
  let text = "";
  for (const { at, key } of keystrokes) {
    if (at > ms) break;
    text = key === "Backspace" ? text.slice(0, -1) : text + key;
  }
  let correct = 0;
  while (correct < text.length && text[correct] === target[correct]) correct++;
  return target.length === 0 ? 0 : correct / target.length;
}

export function progress(state: RaceState): number {
  let correct = 0;
  while (correct < state.typed.length && state.typed[correct] === state.target[correct]) correct++;
  return state.target.length === 0 ? 0 : correct / state.target.length;
}

// Is this run better than the best so far? Faster wins; a run under 90% accuracy never counts.
export function isNewBest(run: Stats, best: Stats | null): boolean {
  if (run.accuracy < 90) return false;
  return best === null || run.wpm > best.wpm;
}

export const PASSAGES = [
  "The matatu swung round the corner at Kencom, bass shaking the windows, and the conductor leaned out to shout the fare to anyone who would listen.",
  "Nyama choma tastes best on a Saturday afternoon, with friends, a plate of kachumbari, and nobody in any hurry to go home.",
  "She checked the time, counted the notes in her hand twice, and ran for the last bus to Rongai as the rain began to fall.",
  "At the gate, the ticket scanner beeped green, the crowd cheered, and the first notes of the band drifted over the gardens.",
  "Every morning the market wakes before the sun: crates of mangoes, stacks of sukuma, and the smell of fresh mandazi in the air.",
];

// The same passage for everyone on the same day, so friends can race the same words.
export function passageFor(date: Date): string {
  const day = Math.floor(date.getTime() / 86_400_000);
  return PASSAGES[day % PASSAGES.length];
}
