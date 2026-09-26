import { ANSWERS } from "./words.ts";
import { answerFor, keyboard, LENGTH, newGame, noStats, play, puzzleNumber, record, score, shareText, TRIES, type Game, type Stats } from "./wordle.ts";

// The page. The rules are in wordle.ts.
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const puzzle = puzzleNumber(new Date());
const answer = answerFor(puzzle);
const store = {
  get<T>(key: string, fallback: T): T {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* the game still works, it just won't remember */
    }
  },
};

// Today's game carries on after a reload; yesterday's is replaced.
const saved = store.get<Game & { puzzle?: number }>("neno-game", newGame(answer));
let game: Game = saved.puzzle === puzzle && saved.answer === answer ? saved : newGame(answer);
let stats: Stats = store.get("neno-stats", noStats());
let revealed = game.guesses.length; // rows already flipped (no animation on reload)

$("number").textContent = `#${puzzle}`;
const rows = Array.from({ length: TRIES }, () => {
  const row = Object.assign(document.createElement("div"), { className: "row" });
  row.setAttribute("role", "row");
  row.append(...Array.from({ length: LENGTH }, (_, i) => Object.assign(document.createElement("div"), { className: "tile", role: "gridcell", style: `--i:${i}` })));
  $("board").append(row);
  return row;
});

const LAYOUT = ["qwertyuiop", "asdfghjkl", "+zcvbnm-"]; // q isn't used in Kiswahili, but keeps the keyboard familiar
LAYOUT.forEach((line) => {
  const row = Object.assign(document.createElement("div"), { className: "krow" });
  for (const ch of line) {
    const key = Object.assign(document.createElement("button"), { type: "button", className: "key" }) as HTMLButtonElement;
    if (ch === "+") Object.assign(key, { textContent: "Enter", className: "key wide" }), (key.dataset.action = "enter");
    else if (ch === "-") Object.assign(key, { textContent: "⌫", className: "key wide" }), key.setAttribute("aria-label", "Delete"), (key.dataset.action = "back");
    else Object.assign(key, { textContent: ch }), (key.dataset.letter = ch);
    row.append(key);
  }
  $("keys").append(row);
});

let toastTimer: ReturnType<typeof setTimeout> | undefined;
function toast(message: string, ms = 1800): void {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), ms);
}

function render(): void {
  rows.forEach((row, r) => {
    const word = game.guesses[r] ?? (r === game.guesses.length ? game.current : "");
    const marks = game.guesses[r] ? score(game.guesses[r], answer) : null;
    [...row.children].forEach((tile, i) => {
      const el = tile as HTMLElement;
      el.textContent = word[i] ?? "";
      el.classList.toggle("filled", Boolean(word[i]) && !marks);
      if (marks) {
        el.dataset.mark = marks[i];
        if (r < revealed) el.style.animation = "none";
      } else delete el.dataset.mark;
      el.setAttribute("aria-label", word[i] ? `${word[i]}${marks ? `, ${marks[i]}` : ""}` : "empty");
    });
  });
  const keys = keyboard(game.guesses, answer);
  document.querySelectorAll<HTMLElement>("[data-letter]").forEach((key) => {
    const mark = keys[key.dataset.letter!];
    if (mark) key.dataset.mark = mark;
    key.setAttribute("aria-label", `${key.dataset.letter}${mark ? `, ${mark}` : ""}`);
  });
}

function showResult(): void {
  $("result-title").textContent = game.status === "won" ? "Umeshinda! You got it" : "Pole sana";
  $("meaning").innerHTML = `<strong></strong> means “${ANSWERS[answer]}”`;
  $("meaning").querySelector("strong")!.textContent = answer;
  const percent = stats.played ? Math.round((stats.won / stats.played) * 100) : 0;
  $("stats").innerHTML = [["Played", stats.played], ["Win %", percent], ["Streak", stats.streak], ["Best", stats.best]].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
  const most = Math.max(1, ...stats.spread);
  $("spread").innerHTML = stats.spread.map((n, i) => `<div class="bar ${game.status === "won" && game.guesses.length === i + 1 ? "now" : ""}"><span>${i + 1}</span><span style="width:${Math.max(8, (n / most) * 100)}%">${n}</span></div>`).join("");
  $<HTMLDialogElement>("result").showModal();
}

function act(action: Parameters<typeof play>[1]): void {
  const before = game;
  game = play(game, action);
  if (game.message && action.type === "enter" && game.guesses.length === before.guesses.length) {
    rows[game.guesses.length].classList.remove("shake");
    void rows[game.guesses.length].offsetWidth; // restart the animation
    rows[game.guesses.length].classList.add("shake");
    toast(game.message);
  }
  render();
  revealed = game.guesses.length;
  store.set("neno-game", { ...game, puzzle });
  if (before.status === "playing" && game.status !== "playing") {
    stats = record(stats, game, puzzle);
    store.set("neno-stats", stats);
    setTimeout(() => (toast(game.message ?? "", 2200), setTimeout(showResult, 1200)), 1500); // after the tiles flip
  }
}

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector("dialog[open]")) return;
  if (e.key === "Enter") act({ type: "enter" });
  else if (e.key === "Backspace") act({ type: "back" });
  else if (/^[a-z]$/i.test(e.key)) act({ type: "letter", letter: e.key });
});
$("keys").addEventListener("click", (e) => {
  const key = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
  if (!key) return;
  if (key.dataset.letter) act({ type: "letter", letter: key.dataset.letter });
  else act({ type: key.dataset.action as "enter" | "back" });
  key.blur(); // so Enter on the real keyboard doesn't press this key again
});
$("share").addEventListener("click", async () => {
  const text = shareText(game, puzzle);
  try {
    if (navigator.share) await navigator.share({ text });
    else (await navigator.clipboard.writeText(text), toast("Imenakiliwa · Copied"));
  } catch {
    /* they cancelled */
  }
});
$("close").addEventListener("click", () => $<HTMLDialogElement>("result").close());
$("stats-button").addEventListener("click", showResult);
$("help").addEventListener("click", () => $<HTMLDialogElement>("rules").showModal());
$("rules-close").addEventListener("click", () => $<HTMLDialogElement>("rules").close());

render();
if (!store.get("neno-seen-rules", false)) ($<HTMLDialogElement>("rules").showModal(), store.set("neno-seen-rules", true));
else if (game.status !== "playing") showResult();
