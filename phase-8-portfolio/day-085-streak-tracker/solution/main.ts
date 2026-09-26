import { completionRate, currentStreak, localDay, longestStreak, milestone, toggle, weekGrid, type Habit } from "./streaks.ts";

// The page. The streak rules are in streaks.ts; this draws them and remembers habits on the device.
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
const today = () => localDay(new Date(), TIME_ZONE);
const KEY = "streaks-habits";

function load(): Habit[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null") ?? starterHabits();
  } catch {
    return starterHabits();
  }
}
function save(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(habits));
  } catch {
    // Storage is full or blocked: habits last until the page closes.
  }
}
function starterHabits(): Habit[] {
  return [{ id: crypto.randomUUID(), name: "Drink 2 litres of water", emoji: "💧", checkins: [], createdOn: today() }];
}

let habits = load();
let deleted: { habit: Habit; index: number } | null = null;
let justReached: { id: string; message: string } | null = null;

function render(): void {
  const day = today();
  $("today").textContent = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const doneToday = habits.filter((h) => h.checkins.includes(day)).length;
  $("summary").textContent = habits.length ? `${doneToday} of ${habits.length} done today` : "";
  $("empty").hidden = habits.length > 0;

  $("habits").replaceChildren(
    ...habits.map((habit) => {
      const streak = currentStreak(habit.checkins, day);
      const done = habit.checkins.includes(day);
      const li = document.createElement("li");
      li.className = "habit";
      li.innerHTML = `
        <div class="habit-head">
          <span class="habit-emoji" aria-hidden="true"></span>
          <div><h3 class="habit-name"></h3><p class="habit-streak"></p></div>
        </div>
        <button type="button" class="check"><span aria-hidden="true">✓</span></button>
        <div class="grid" aria-hidden="true"></div>
        <div class="habit-foot"><span class="rate"></span><button type="button" class="delete">Delete</button></div>`;
      li.querySelector(".habit-emoji")!.textContent = habit.emoji;
      li.querySelector(".habit-name")!.textContent = habit.name;
      li.querySelector(".habit-streak")!.innerHTML = streak ? `🔥 <strong>${streak}</strong> ${streak === 1 ? "day" : "days"} in a row` : done ? "" : "Start your streak today";
      const check = li.querySelector<HTMLButtonElement>(".check")!;
      check.setAttribute("aria-pressed", String(done));
      check.setAttribute("aria-label", `${habit.name}: done today`);
      check.addEventListener("click", () => {
        habits = habits.map((h) => (h.id === habit.id ? toggle(h, day, day) : h));
        const now = habits.find((h) => h.id === habit.id)!;
        const reached = now.checkins.includes(day) ? milestone(currentStreak(now.checkins, day)) : null;
        justReached = reached ? { id: habit.id, message: reached } : null;
        save();
        render();
        (document.querySelector(`[data-id="${habit.id}"] .check`) as HTMLButtonElement | null)?.focus();
      });
      li.dataset.id = habit.id;
      li.querySelector(".grid")!.append(
        ...weekGrid(habit.checkins, day).flatMap((week) =>
          week.map((cell) => Object.assign(document.createElement("span"), { className: ["cell", cell.done ? "done" : "", cell.future ? "future" : "", cell.day === day ? "today" : ""].filter(Boolean).join(" ") })),
        ),
      );
      li.querySelector(".rate")!.textContent = `${Math.round(completionRate(habit, day) * 100)}% of the last 30 days · best ${longestStreak(habit.checkins)}`;
      li.querySelector<HTMLButtonElement>(".delete")!.setAttribute("aria-label", `Delete ${habit.name}`);
      li.querySelector(".delete")!.addEventListener("click", () => {
        deleted = { habit, index: habits.indexOf(habit) };
        habits = habits.filter((h) => h.id !== habit.id);
        save();
        render();
        showToast(`Deleted "${habit.name}"`);
      });
      if (justReached?.id === habit.id) li.append(Object.assign(document.createElement("p"), { className: "milestone", textContent: justReached.message }));
      return li;
    }),
  );
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
function showToast(text: string): void {
  $("toast-text").textContent = text;
  $("toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (($("toast").hidden = true), (deleted = null)), 6000);
}
$("undo").addEventListener("click", () => {
  if (!deleted) return;
  habits.splice(deleted.index, 0, deleted.habit);
  deleted = null;
  $("toast").hidden = true;
  save();
  render();
});

$("add").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $<HTMLInputElement>("name").value.trim();
  if (!name) return;
  habits = [...habits, { id: crypto.randomUUID(), name, emoji: $<HTMLSelectElement>("emoji").value, checkins: [], createdOn: today() }];
  $<HTMLInputElement>("name").value = "";
  save();
  render();
});

// A new day starts while the app is open (or it wakes up the next morning): redraw.
document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && render());

if (import.meta.env.PROD && "serviceWorker" in navigator) void navigator.serviceWorker.register("./sw.js");
render();
