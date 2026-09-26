// The lesson page: renders a day's README.md straight from its folder, plus the checklist.
(function () {
  var days = window.TS_DAYS, phases = window.TS_PHASES, P = window.TS_PROGRESS;
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var n = parseInt(params.get("day"), 10);
  if (!(n >= 1 && n <= days.length)) n = 1;
  var day = days[n - 1];
  var phase = phases[day.phase - 1];
  var BLOB = P.REPO + "/blob/main/";
  var TREE = P.REPO + "/tree/main/";

  // ----- the header -----
  document.documentElement.style.setProperty("--pc", "var(--p" + day.phase + ")");
  document.title = "Day " + n + ": " + day.title + " · 100 Days of TypeScript";
  $("badge").textContent = n;
  $("title").textContent = day.title;
  if (day.topic) {
    $("topic").textContent = day.topic;
    $("topic").hidden = false;
  }
  $("crumb-phase").textContent = "Phase " + phase.n + ": " + phase.name;
  $("crumb-day").textContent = "Day " + n;
  var labels = ['<span class="label">Phase ' + phase.n + " · Day " + (n - phase.first + 1) + " of " + (phase.last - phase.first + 1) + "</span>"];
  if (day.capstone) labels.push('<span class="label label-cap">Capstone</span>');
  if (n >= 81) labels.push('<span class="label">No walkthrough</span>');
  $("labels").innerHTML = labels.join("");
  $("cmd").textContent = "npm test -- day-" + P.pad(n);
  $("gh-folder").href = TREE + day.path;
  $("gh-solution").href = TREE + day.path + "/solution";

  // ----- the lesson -----
  var lesson = $("lesson");
  var file = "../" + day.path + "/README.md";
  fetch(file)
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    })
    .then(function (md) {
      lesson.innerHTML = marked.parse(md);
      enhance();
    })
    .catch(function () {
      lesson.innerHTML =
        '<div class="notice"><h2>This lesson couldn\'t load</h2>' +
        "<p>Browsers won't let a page opened straight from your disk read other files. From the course folder, run " +
        "<code>python3 -m http.server 8000</code> and open <code>http://localhost:8000/site/</code>.</p>" +
        '<p>Or read it on GitHub: <a href="' + BLOB + day.path + '/README.md">' + P.esc(day.path) + "/README.md</a></p></div>";
    });

  // A link in a README is relative to its folder. Another day's README opens here; any other file
  // in the repo opens on GitHub.
  function rewrite(a) {
    var href = a.getAttribute("href");
    if (!href || /^(https?:|mailto:|#)/.test(href)) return;
    var resolved = new URL(href, "https://repo.invalid/" + day.path + "/");
    var path = decodeURIComponent(resolved.pathname.slice(1)).replace(/\/$/, "");
    var target = days.find(function (d) { return path === d.path || path === d.path + "/README.md"; });
    if (target) {
      a.href = P.dayUrl(target.day) + resolved.hash;
      return;
    }
    var looksLikeFile = /\.[a-z0-9]+$/i.test(path);
    a.href = (looksLikeFile ? BLOB : TREE) + path + resolved.hash;
  }

  function enhance() {
    lesson.querySelectorAll("a[href]").forEach(rewrite);

    lesson.querySelectorAll("table").forEach(function (t) {
      var wrap = document.createElement("div");
      wrap.className = "table-wrap";
      t.parentNode.insertBefore(wrap, t);
      wrap.appendChild(t);
    });

    lesson.querySelectorAll("pre").forEach(function (pre) {
      var code = pre.querySelector("code");
      // Highlight only blocks that say their language: the rest are output and diagrams.
      if (code && /language-/.test(code.className) && window.hljs) {
        try { hljs.highlightElement(code); } catch (e) { /* unknown language: leave it plain */ }
      }
      var wrap = document.createElement("div");
      wrap.className = "code";
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);
      var button = document.createElement("button");
      button.type = "button";
      button.className = "copy";
      button.textContent = "Copy";
      button.addEventListener("click", function () {
        var done = function (text) {
          button.textContent = text;
          setTimeout(function () { button.textContent = "Copy"; }, 1600);
        };
        var select = function () {
          var range = document.createRange();
          range.selectNodeContents(pre);
          var sel = getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          done("Press Ctrl+C");
        };
        try {
          navigator.clipboard.writeText(pre.innerText).then(function () { done("Copied!"); }, select);
        } catch (e) {
          select();
        }
      });
      wrap.appendChild(button);
    });
  }

  // ----- the checklist -----
  var state = P.load();
  var items = P.checklist(day);
  var saved = P.ticks(state, n);
  var list = $("checklist");
  items.forEach(function (html, i) {
    var li = document.createElement("li");
    li.innerHTML = '<label><input type="checkbox"' + (saved[i] ? " checked" : "") + "><span>" + html + "</span></label>";
    li.querySelector("input").addEventListener("change", update);
    list.appendChild(li);
  });

  function update() {
    var boxes = Array.prototype.map.call(list.querySelectorAll("input"), function (b) { return b.checked; });
    state[String(n)] = boxes;
    P.save(state);
    meter();
  }
  function meter() {
    var pct = P.percent(state, n);
    $("bar").style.width = pct + "%";
    $("pct").textContent = pct + "%";
    $("meter").setAttribute("aria-valuenow", String(pct));
    var msg = $("done-msg");
    if (pct === 100) {
      msg.innerHTML = n < days.length
        ? 'Day ' + n + ' done! 🎉 <a href="' + P.dayUrl(n + 1) + '">On to Day ' + (n + 1) + " →</a>"
        : "That's all 100 days. You did it. 🏆";
      msg.hidden = false;
    } else {
      msg.hidden = true;
    }
  }
  meter();

  // ----- previous and next -----
  var pager = $("pager");
  function link(target, cls, label) {
    var a = document.createElement("a");
    a.className = cls;
    a.href = P.dayUrl(target.day);
    a.innerHTML = "<small>" + label + "</small><strong>" + P.esc(target.title) + "</strong>";
    pager.appendChild(a);
  }
  if (n > 1) link(days[n - 2], "prev", "← Day " + (n - 1));
  if (n < days.length) link(days[n], "next", "Day " + (n + 1) + " →");
})();
