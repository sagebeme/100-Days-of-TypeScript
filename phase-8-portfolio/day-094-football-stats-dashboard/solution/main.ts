import seasonCsv from "./season.csv?raw";
import { leagueTable, niceTicks, parseResults, pointsRace, topScorers, type Result } from "./stats.ts";

// The page. The numbers come from stats.ts; this draws them.
const $ = <T extends Element>(id: string) => document.getElementById(id) as unknown as T;
const COLOURS = ["#047857", "#2563eb", "#d97706", "#db2777", "#7c3aed"];
let results: Result[] = parseResults(seasonCsv).results;
let selected: string | null = null;

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`); // a CSV is typed by somebody

function render(): void {
  const table = leagueTable(results);
  const goals = results.reduce((s, r) => s + r.homeGoals + r.awayGoals, 0);
  const biggest = [...results].sort((a, b) => Math.abs(b.homeGoals - b.awayGoals) - Math.abs(a.homeGoals - a.awayGoals))[0];
  $("tiles").innerHTML = [
    [results.length, "matches played"],
    [goals, "goals"],
    [results.length ? (goals / results.length).toFixed(2) : "0", "goals a game"],
    [biggest ? `${biggest.homeGoals}–${biggest.awayGoals}` : "–", biggest ? `biggest win: ${escape(biggest.home)} v ${escape(biggest.away)}` : "biggest win"],
  ]
    .map(([n, label]) => `<li><strong>${n}</strong><span>${label}</span></li>`)
    .join("");

  $("table").innerHTML = `<thead><tr><th>#</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th><th>Form</th></tr></thead><tbody>${table
    .map((row, i) => {
      const classes = [i === 0 ? "champion" : "", i >= table.length - 2 ? "relegated" : "", row.team === selected ? "selected" : ""].join(" ");
      const form = row.form.map((o) => `<i data-o="${o}" title="${{ W: "Won", D: "Drew", L: "Lost" }[o]}">${o}</i>`).join("");
      return `<tr class="${classes}"><td>${i + 1}</td><td class="team"><button type="button" data-team="${escape(row.team)}" aria-pressed="${row.team === selected}">${escape(row.team)}</button></td><td>${row.played}</td><td>${row.won}</td><td>${row.drawn}</td><td>${row.lost}</td><td>${row.goalDifference > 0 ? "+" : ""}${row.goalDifference}</td><td class="pts">${row.points}</td><td><span class="form" aria-label="Last five: ${row.form.join(" ")}">${form}</span></td></tr>`;
    })
    .join("")}</tbody>`;

  // The chart: points after each match, for the top four (and the chosen club).
  const teams = [...new Set([...table.slice(0, 4).map((r) => r.team), ...(selected ? [selected] : [])])];
  const lines = teams.map((team) => ({ team, points: pointsRace(results, team) }));
  const maxPoints = Math.max(1, ...lines.flatMap((l) => l.points));
  const games = Math.max(1, ...lines.map((l) => l.points.length));
  const ticks = niceTicks(maxPoints, 4);
  const [left, right, top, bottom] = [34, 470, 12, 232];
  const x = (i: number) => left + ((right - left) * (i + 1)) / games;
  const y = (p: number) => bottom - ((bottom - top) * p) / ticks.at(-1)!;
  const grid = ticks.map((t) => `<line class="grid-line" x1="${left}" x2="${right}" y1="${y(t)}" y2="${y(t)}" /><text x="${left - 8}" y="${y(t) + 4}" text-anchor="end">${t}</text>`).join("");
  const paths = lines
    .map((l, i) => `<polyline class="${selected && l.team !== selected ? "dim" : ""}" stroke="${COLOURS[i % COLOURS.length]}" points="${[`${left},${bottom}`, ...l.points.map((p, j) => `${x(j)},${y(p)}`)].join(" ")}" />`)
    .join("");
  $("race").innerHTML = `${grid}${paths}<text x="${right}" y="${bottom + 20}" text-anchor="end">matches played</text>`;
  $("race").setAttribute("aria-label", `Points so far: ${lines.map((l) => `${l.team} ${l.points.at(-1) ?? 0}`).join(", ")}`);
  $("legend").innerHTML = lines.map((l, i) => `<li><i style="background:${COLOURS[i % COLOURS.length]}"></i>${escape(l.team)} · ${l.points.at(-1) ?? 0}</li>`).join("");

  const scorers = topScorers(results, 8);
  const most = Math.max(1, ...scorers.map((s) => s.goals));
  $("scorers").innerHTML = scorers.map((s) => `<li><span class="who">${escape(s.player)}</span><span class="club">${escape(s.team)}</span><span class="goals">${s.goals}</span><span class="bar" style="width:${(s.goals / most) * 100}%"></span></li>`).join("");
}

$("table").addEventListener("click", (e) => {
  const team = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-team]")?.dataset.team;
  if (!team) return;
  selected = selected === team ? null : team;
  render();
  $<HTMLElement>("table").querySelector<HTMLButtonElement>(`button[data-team="${CSS.escape(team)}"]`)?.focus();
});

$("file").addEventListener("change", async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const parsed = parseResults(await file.text());
  const box = $<HTMLElement>("errors");
  box.hidden = parsed.errors.length === 0;
  box.textContent = parsed.errors.length ? `Some lines were skipped:\n${parsed.errors.slice(0, 8).join("\n")}${parsed.errors.length > 8 ? `\n…and ${parsed.errors.length - 8} more` : ""}` : "";
  if (parsed.results.length) {
    results = parsed.results;
    selected = null;
    render();
  }
});

render();
