// Progress, kept in this browser only: { "30": [true, true, false, false] } is Day 30's checklist.
// Shared by every page. No accounts, no server.
(function () {
  var KEY = "ts100-progress";
  var REPO = "https://github.com/sagebeme/100-Days-of-TypeScript";

  // The same four steps every day, straight from the course README's routine.
  function checklist(day) {
    var n = String(day.day).padStart(3, "0");
    return [
      "Read the brief",
      "Wrote my code in <code>starter/</code>",
      "Tests pass: <code>npm test -- day-" + n + "</code>",
      "Compared with <code>solution/</code> and committed"
    ];
  }

  function load() {
    try {
      var state = JSON.parse(localStorage.getItem(KEY) || "{}");
      return state && typeof state === "object" ? state : {};
    } catch (e) {
      return {};
    }
  }
  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private window: progress just isn't kept */ }
  }
  function ticks(state, day) {
    var saved = state[String(day)];
    return Array.isArray(saved) ? saved : [];
  }
  // 0 to 100 for one day.
  function percent(state, day) {
    var t = ticks(state, day);
    var done = t.filter(Boolean).length;
    return Math.round((done / 4) * 100);
  }
  function isDone(state, day) { return percent(state, day) === 100; }

  // Where to go next: the first unfinished day after the last one touched. Null if nothing's touched.
  function nextDay(state, days) {
    var touched = days.filter(function (d) { return ticks(state, d.day).some(Boolean); });
    if (!touched.length) return null;
    var last = touched[touched.length - 1].day;
    if (!isDone(state, last)) return last;
    for (var n = last + 1; n <= days.length; n++) if (!isDone(state, n)) return n;
    for (n = 1; n <= days.length; n++) if (!isDone(state, n)) return n;
    return days.length;
  }

  function dayUrl(n) { return "day.html?day=" + n; }
  function pad(n) { return String(n).padStart(3, "0"); }

  // Escape text before it goes into innerHTML.
  function esc(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // The round "back to top" button, on every page.
  function backToTop() {
    var a = document.querySelector(".to-top");
    if (!a) return;
    var update = function () { a.classList.toggle("show", window.scrollY > 700); };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }
  document.addEventListener("DOMContentLoaded", backToTop);

  window.TS_PROGRESS = {
    REPO: REPO, checklist: checklist, load: load, save: save, ticks: ticks, percent: percent,
    isDone: isDone, nextDay: nextDay, dayUrl: dayUrl, pad: pad, esc: esc
  };
})();
