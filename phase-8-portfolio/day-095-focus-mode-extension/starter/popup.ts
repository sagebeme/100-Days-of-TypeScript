import { loadSettings, saveSettings } from "./chrome.ts";
import { formatLeft, inSchedule, isFocusing, parseBlocklist, type Settings } from "./rules.ts";

// The popup: start or stop a focus session, and edit the list.
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
let settings: Settings = await loadSettings();
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function render(): void {
  const now = new Date();
  const focusing = isFocusing(now, settings);
  const manual = settings.focusUntil !== null && now.getTime() < settings.focusUntil;
  const scheduled = inSchedule(now, settings.schedule, settings.timeZone);
  $("status").toggleAttribute("data-on", focusing);
  $("state").textContent = focusing ? "Focusing" : "Not focusing";
  $("detail").textContent = manual ? `${formatLeft(settings.focusUntil! - now.getTime())} left` : scheduled ? "Your schedule is on" : `${settings.blocklist.length} sites wait for your next session`;
  $("stop").hidden = !manual;
  $<HTMLTextAreaElement>("list").value ||= settings.blocklist.join("\n");
  $("schedule").textContent = settings.schedule.length
    ? `Every ${settings.schedule.map((s) => `${s.days.map((d) => DAY_NAMES[d]).join(", ")} ${s.start}–${s.end}`).join("; ")}`
    : "No schedule: focus with the buttons above.";
}

$("buttons").addEventListener("click", async (e) => {
  const button = (e.target as HTMLElement).closest("button");
  if (!button) return;
  settings = { ...settings, focusUntil: button.id === "stop" ? null : Date.now() + Number(button.dataset.minutes) * 60_000 };
  await saveSettings(settings);
  render();
});

$("list-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const { domains, problems } = parseBlocklist($<HTMLTextAreaElement>("list").value);
  $("problems").textContent = problems.join(" · ");
  if (problems.length) return;
  settings = { ...settings, blocklist: domains };
  $<HTMLTextAreaElement>("list").value = domains.join("\n");
  await saveSettings(settings);
  $("saved").textContent = `Saved ${domains.length} sites.`;
  render();
});

render();
setInterval(render, 15_000);
