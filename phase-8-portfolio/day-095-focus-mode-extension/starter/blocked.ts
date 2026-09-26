import { loadSettings } from "./chrome.ts";
import { formatLeft, inSchedule } from "./rules.ts";

// The page a blocked site turns into.
const site = new URLSearchParams(location.search).get("site");
if (site) document.getElementById("site")!.textContent = site;
const settings = await loadSettings();
const now = Date.now();
const left = document.getElementById("left")!;
if (settings.focusUntil && settings.focusUntil > now) left.textContent = `${formatLeft(settings.focusUntil - now)} to go.`;
else if (inSchedule(new Date(), settings.schedule, settings.timeZone)) left.textContent = "Until your focus time ends.";
document.getElementById("back")!.addEventListener("click", () => (history.length > 1 ? history.back() : window.close()));
