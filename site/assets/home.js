// The landing page: resume button, the JS-vs-TS demo, and the phase timeline.
(function () {
  var days = window.TS_DAYS, phases = window.TS_PHASES, P = window.TS_PROGRESS;
  var state = P.load();
  var next = P.nextDay(state, days);
  var $ = function (id) { return document.getElementById(id); };

  // ----- welcome back -----
  if (next) {
    var d = days[next - 1];
    var done = days.filter(function (x) { return P.isDone(state, x.day); }).length;
    ["cta", "cta-2", "cta-3"].forEach(function (id) {
      $(id).href = P.dayUrl(next);
      $(id).textContent = "Continue with Day " + next + " →";
    });
    $("resume").textContent = done === days.length
      ? "You've finished all 100 days. Legend."
      : "Welcome back. You've finished " + done + " of 100 days. Up next: Day " + next + ", " + d.title + ".";
    $("resume").hidden = false;
    $("cta-text").textContent = "Up next: Day " + next + ", " + d.title + ". One hour. You've got this.";
  }

  // ----- JavaScript vs TypeScript -----
  var demos = {
    js: {
      file: "split.js",
      types: ["", "", ""],
      out: "Each person pays KES 800,080 🙃<br>JavaScript glued \"4800\" and 480 into \"4800480\".",
      cls: "bad",
      verdict: "JavaScript runs it without a word. The form gave you text, not a number, so <code>\"4800\" + 480</code> sticks them together, and everyone gets a bill for KES 800,080."
    },
    ts: {
      file: "split.ts",
      types: [": number", ": number", ": number"],
      out: "split.ts:5:22 - error TS2345: Argument of type 'string' is not<br>assignable to parameter of type 'number'.",
      cls: "bad",
      verdict: "TypeScript stops you before you even run it, and points at the exact spot. Turn the text into a number with <code>Number(input.value)</code> and everyone pays KES 880."
    }
  };
  var tabs = { js: $("tab-js"), ts: $("tab-ts") };
  function show(key) {
    var demo = demos[key];
    $("demo-file").textContent = demo.file;
    ["ann-1", "ann-2", "ann-3"].forEach(function (id, i) {
      $(id).innerHTML = demo.types[i] ? '<span class="t">' + demo.types[i] + "</span>" : "";
    });
    $("arg").className = key === "ts" ? "squiggle" : "";
    $("demo-out").className = "out " + demo.cls;
    $("demo-out").innerHTML = demo.out;
    $("verdict").innerHTML = demo.verdict;
    Object.keys(tabs).forEach(function (k) {
      tabs[k].setAttribute("aria-selected", String(k === key));
      tabs[k].tabIndex = k === key ? 0 : -1;
    });
    $("demo-panel").setAttribute("aria-labelledby", tabs[key].id);
  }
  tabs.js.addEventListener("click", function () { show("js"); });
  tabs.ts.addEventListener("click", function () { show("ts"); });
  document.querySelector(".tabs").addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    var key = tabs.js.getAttribute("aria-selected") === "true" ? "ts" : "js";
    show(key);
    tabs[key].focus();
  });
  show("js");

  // ----- the timeline -----
  var currentPhase = next ? days[next - 1].phase : 1;
  var list = $("timeline");
  phases.forEach(function (ph) {
    var own = days.filter(function (d) { return d.phase === ph.n; });
    var finished = own.filter(function (d) { return P.isDone(state, d.day); }).length;
    var pct = Math.round((finished / own.length) * 100);
    var isHere = ph.n === currentPhase;
    var li = document.createElement("li");
    li.className = "phase";
    li.style.setProperty("--pc", "var(--p" + ph.n + ")");
    li.innerHTML =
      '<span class="node" aria-hidden="true">' + ph.n + "</span>" +
      '<div class="card">' +
        (isHere ? '<span class="here" aria-hidden="true">' + (next ? "You are here" : "Start here") + "</span>" : "") +
        '<div class="top"><small>Phase ' + ph.n + " · Days " + ph.first + "–" + ph.last + "</small><h3>" + P.esc(ph.name) + "</h3></div>" +
        '<div class="body">' +
          "<p><b>You learn:</b> " + P.esc(ph.learn) + "</p>" +
          "<p><b>Ends with:</b> " + P.esc(ph.ends) + "</p>" +
          '<div class="meter"><div class="progress" role="progressbar" aria-label="Phase ' + ph.n + ' progress" aria-valuemin="0" aria-valuemax="' + own.length + '" aria-valuenow="' + finished + '"><span style="width:' + pct + '%"></span></div>' + finished + "/" + own.length + " done</div>" +
          "<details" + (isHere ? " open" : "") + '><summary>Days ' + ph.first + "–" + ph.last + '</summary><ul class="day-list"></ul></details>' +
        "</div>" +
      "</div>";
    var ul = li.querySelector(".day-list");
    own.forEach(function (d) {
      var p = P.percent(state, d.day);
      var status = p === 100 ? '<span class="label label-done">Done</span>'
        : d.day === next ? '<span class="label label-next">Up next</span>'
        : d.capstone ? '<span class="label label-cap">Capstone</span>'
        : p > 0 ? '<span class="label">' + p + "%</span>" : "";
      var item = document.createElement("li");
      item.innerHTML = '<a href="' + P.dayUrl(d.day) + '"><span class="n">Day ' + d.day + '</span><span class="t">' + P.esc(d.title) + "</span>" + status + "</a>";
      ul.appendChild(item);
    });
    list.appendChild(li);
  });
})();
