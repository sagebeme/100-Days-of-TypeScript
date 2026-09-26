// Everything the dashboard shows, worked out from a list of results.

export interface Goal {
  player: string;
  team: string;
  minute: number;
}

export interface Result {
  date: string; // YYYY-MM-DD
  home: string;
  away: string;
  homeGoals: number;
  awayGoals: number;
  scorers: Goal[];
}

// Read the season from CSV: date,home,away,home_goals,away_goals,scorers, with scorers written as
// "player|team|minute" separated by ";". Every problem is reported with its line number.
export function parseResults(csv: string): { results: Result[]; errors: string[] } {
  const results: Result[] = [];
  const errors: string[] = [];
  const lines = csv.replace(/\r\n?/g, "\n").split("\n");
  lines.forEach((line, i) => {
    const n = i + 1;
    if (i === 0 || !line.trim()) return; // the header, and blank lines
    const cells = line.split(",");
    if (cells.length < 5) return void errors.push(`Line ${n}: expected at least 5 columns, found ${cells.length}`);
    const [date, home, away, hg, ag, scorerText = ""] = cells.map((c) => c.trim());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return void errors.push(`Line ${n}: "${date}" isn't a date like 2026-08-15`);
    if (!home || !away || home === away) return void errors.push(`Line ${n}: a match needs two different teams`);
    const homeGoals = Number(hg);
    const awayGoals = Number(ag);
    if (!Number.isInteger(homeGoals) || homeGoals < 0 || !Number.isInteger(awayGoals) || awayGoals < 0) return void errors.push(`Line ${n}: the score must be whole numbers`);
    const scorers: Goal[] = [];
    for (const part of scorerText.split(";").filter(Boolean)) {
      const [player, team, minute] = part.split("|").map((s) => s.trim());
      if (!player || (team !== home && team !== away) || !(Number(minute) >= 1 && Number(minute) <= 120)) return void errors.push(`Line ${n}: can't read the scorer "${part}"`);
      scorers.push({ player, team, minute: Number(minute) });
    }
    const counted = (team: string) => scorers.filter((s) => s.team === team).length;
    if (scorers.length && (counted(home) !== homeGoals || counted(away) !== awayGoals)) return void errors.push(`Line ${n}: the scorers don't match the score`);
    results.push({ date, home, away, homeGoals, awayGoals, scorers });
  });
  return { results: results.sort((a, b) => a.date.localeCompare(b.date)), errors };
}

export type Outcome = "W" | "D" | "L";

export interface Row {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: Outcome[]; // the last five, oldest first
}

const outcome = (mine: number, theirs: number): Outcome => (mine > theirs ? "W" : mine < theirs ? "L" : "D");

// Three points for a win, one for a draw. Level on points: goal difference, then goals scored, then name.
export function leagueTable(results: Result[]): Row[] {
  const rows = new Map<string, Row & { all: Outcome[] }>();
  const row = (team: string) => {
    if (!rows.has(team)) rows.set(team, { team, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, form: [], all: [] });
    return rows.get(team)!;
  };
  for (const r of [...results].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const [team, mine, theirs] of [
      [r.home, r.homeGoals, r.awayGoals],
      [r.away, r.awayGoals, r.homeGoals],
    ] as const) {
      const t = row(team);
      const o = outcome(mine, theirs);
      t.played++;
      t.goalsFor += mine;
      t.goalsAgainst += theirs;
      if (o === "W") (t.won++, (t.points += 3));
      else if (o === "D") (t.drawn++, t.points++);
      else t.lost++;
      t.all.push(o);
    }
  }
  return [...rows.values()]
    .map(({ all, ...t }) => ({ ...t, goalDifference: t.goalsFor - t.goalsAgainst, form: all.slice(-5) }))
    .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor || a.team.localeCompare(b.team));
}

export function topScorers(results: Result[], limit = 10): { player: string; team: string; goals: number }[] {
  const counts = new Map<string, { player: string; team: string; goals: number }>();
  for (const goal of results.flatMap((r) => r.scorers)) {
    const key = `${goal.player}|${goal.team}`; // two players can share a name
    const entry = counts.get(key) ?? { player: goal.player, team: goal.team, goals: 0 };
    entry.goals++;
    counts.set(key, entry);
  }
  return [...counts.values()].sort((a, b) => b.goals - a.goals || a.player.localeCompare(b.player)).slice(0, limit);
}

export function headToHead(results: Result[], a: string, b: string): { played: number; aWins: number; bWins: number; draws: number; aGoals: number; bGoals: number } {
  const games = results.filter((r) => (r.home === a && r.away === b) || (r.home === b && r.away === a));
  const summary = { played: games.length, aWins: 0, bWins: 0, draws: 0, aGoals: 0, bGoals: 0 };
  for (const g of games) {
    const aGoals = g.home === a ? g.homeGoals : g.awayGoals;
    const bGoals = g.home === a ? g.awayGoals : g.homeGoals;
    summary.aGoals += aGoals;
    summary.bGoals += bGoals;
    if (aGoals > bGoals) summary.aWins++;
    else if (bGoals > aGoals) summary.bWins++;
    else summary.draws++;
  }
  return summary;
}

// Points after each of a team's matches: the line on the "title race" chart.
export function pointsRace(results: Result[], team: string): number[] {
  let points = 0;
  return [...results]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((r) => r.home === team || r.away === team)
    .map((r) => {
      const o = r.home === team ? outcome(r.homeGoals, r.awayGoals) : outcome(r.awayGoals, r.homeGoals);
      points += o === "W" ? 3 : o === "D" ? 1 : 0;
      return points;
    });
}

// Round numbers for a chart's axis: 0, 5, 10… or 0, 10, 20…, covering max with about `count` steps.
export function niceTicks(max: number, count = 5): number[] {
  if (max <= 0) return [0];
  const rough = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rough)!;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => Math.round(i * step * 1e6) / 1e6);
}
