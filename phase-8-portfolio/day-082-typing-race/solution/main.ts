import { compare, ghostProgress, isNewBest, newRace, passageFor, PASSAGES, progress, raceReducer, stats, type Keystroke, type RaceState, type Stats } from "./race.ts";

// The page: draws the race state, and turns key presses into actions. All the rules live in race.ts.
interface BestRun {
  target: string;
  stats: Stats;
  keystrokes: Keystroke[];
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const input = $<HTMLInputElement>("typing");

// localStorage can be missing or throw (private windows): the page works without it.
const BEST_KEY = "typing-race-best";
function loadBest(target: string): BestRun | null {
  try {
    const best = JSON.parse(localStorage.getItem(BEST_KEY) ?? "null") as BestRun | null;
    return best?.target === target ? best : null;
  } catch {
    return null;
  }
}
function saveBest(run: BestRun): void {
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(run));
  } catch {
    // nothing to do: the ghost just won't be there next time
  }
}

let passageIndex = PASSAGES.indexOf(passageFor(new Date()));
let state: RaceState = newRace(PASSAGES[passageIndex]);
let best = loadBest(state.target);

function renderPassage(): void {
  const { states, extra } = compare(state.target, state.typed);
  const passage = $("passage");
  passage.replaceChildren(
    ...[...state.target].map((char, i) => {
      const span = document.createElement("span");
      span.textContent = char;
      span.className = [states[i] === "pending" ? "" : states[i], char === " " && states[i] === "wrong" ? "space" : "", i === state.typed.length ? "caret" : ""].filter(Boolean).join(" ");
      return span;
    }),
    ...[...extra].map((char) => Object.assign(document.createElement("span"), { textContent: char, className: "extra" })),
  );
}

function renderLive(now: number): void {
  const s = stats(state, now);
  $("wpm").textContent = String(Math.round(s.wpm));
  $("accuracy").textContent = `${Math.round(s.accuracy)}%`;
  $("time").textContent = `${s.seconds.toFixed(1)}s`;
  $("you-runner").style.left = `${progress(state) * 100}%`;
  $("hint").hidden = state.startedAt !== null;
  const elapsed = state.startedAt === null ? 0 : (state.finishedAt ?? now) - state.startedAt;
  $("ghost-lane").hidden = best === null;
  if (best) {
    $("ghost-name").textContent = `Best · ${Math.round(best.stats.wpm)}`;
    $("ghost-runner").style.left = `${ghostProgress(best.keystrokes, state.target, elapsed) * 100}%`;
  }
}

function finish(now: number): void {
  const run = stats(state, now);
  const newBest = isNewBest(run, best?.stats ?? null);
  if (newBest) {
    best = { target: state.target, stats: run, keystrokes: state.keystrokes };
    saveBest(best);
  }
  $("badge").textContent = newBest ? "New best!" : run.accuracy < 90 ? "Under 90% accuracy: doesn't count" : "";
  $("result-wpm").textContent = String(Math.round(run.wpm));
  $("result-detail").textContent = `${Math.round(run.accuracy)}% accuracy · ${run.errors} ${run.errors === 1 ? "mistake" : "mistakes"} · ${run.seconds.toFixed(1)} seconds`;
  $("result").hidden = false;
  $<HTMLButtonElement>("again").focus();
}

function restart(nextPassage: boolean): void {
  if (nextPassage) passageIndex = (passageIndex + 1) % PASSAGES.length;
  state = raceReducer(state, { type: "reset", target: PASSAGES[passageIndex] });
  best = loadBest(state.target);
  $("result").hidden = true;
  input.value = "";
  renderPassage();
  renderLive(performance.now());
  input.focus();
}

// Keys come in through a hidden input, so phones show their keyboard too.
input.addEventListener("keydown", (event) => {
  if (event.key === "Backspace" || event.key.length === 1) {
    event.preventDefault();
    const wasFinished = state.finishedAt !== null;
    state = raceReducer(state, { type: "key", key: event.key, now: performance.now() });
    renderPassage();
    if (!wasFinished && state.finishedAt !== null) finish(state.finishedAt);
  }
});
// Phones with predictive keyboards send text through "input" instead: take it one character at a time.
input.addEventListener("input", () => {
  for (const char of input.value) state = raceReducer(state, { type: "key", key: char, now: performance.now() });
  input.value = "";
  renderPassage();
  if (state.finishedAt !== null && $("result").hidden) finish(state.finishedAt);
});
$("board").addEventListener("click", () => input.focus());
$("again").addEventListener("click", () => restart(false));
$("next").addEventListener("click", () => restart(true));

function tick(): void {
  renderLive(performance.now());
  requestAnimationFrame(tick);
}
renderPassage();
tick();
input.focus();
