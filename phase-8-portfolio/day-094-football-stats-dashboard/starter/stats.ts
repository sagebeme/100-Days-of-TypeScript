// Everything the dashboard shows, worked out from a list of results. The tests are the spec.

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

// CSV: date,home,away,home_goals,away_goals,scorers, with scorers as "player|team|minute" separated by ";".
export function parseResults(csv: string): { results: Result[]; errors: string[] } {
  throw new Error(`TODO: parseResults(${csv.length} characters)`);
}

export function leagueTable(results: Result[]): Row[] {
  throw new Error(`TODO: leagueTable(${results.length} results)`);
}

export function topScorers(results: Result[], limit = 10): { player: string; team: string; goals: number }[] {
  throw new Error(`TODO: topScorers(${results.length}, ${limit})`);
}

export function headToHead(results: Result[], a: string, b: string): { played: number; aWins: number; bWins: number; draws: number; aGoals: number; bGoals: number } {
  throw new Error(`TODO: headToHead(${results.length}, ${a}, ${b})`);
}

export function pointsRace(results: Result[], team: string): number[] {
  throw new Error(`TODO: pointsRace(${results.length}, ${team})`);
}

export function niceTicks(max: number, count = 5): number[] {
  throw new Error(`TODO: niceTicks(${max}, ${count})`);
}
