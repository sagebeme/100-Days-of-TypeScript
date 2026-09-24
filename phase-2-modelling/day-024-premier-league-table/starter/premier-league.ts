export interface Match {
  home: string;
  away: string;
  homeGoals: number;
  awayGoals: number;
}

export interface TableRow {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export function isMatch(value: unknown): value is Match {
  // TODO: false unless value is an object (and not null)
  // TODO: home and away must be non-empty strings
  // TODO: homeGoals and awayGoals must be whole numbers, 0 or more (typeof + Number.isInteger)
  throw new Error("not implemented yet");
}

export function parseMatches(csv: string): Match[] {
  // TODO: split into lines with csv.split(/\r?\n/), skip the header (first line) and blank lines
  // TODO: split each line on commas, trim each cell; it must have exactly 4 cells
  // TODO: build a candidate with Number(...) goals; an EMPTY goals cell must become NaN (Number("") is 0)
  // TODO: if !isMatch(candidate), throw new Error(`Line ${n} is not a valid match: ${line}`), n counted from 1 including the header
  throw new Error("not implemented yet");
}

export function buildTable(matches: Match[]): TableRow[] {
  // TODO: tally played/won/drawn/lost/goalsFor/goalsAgainst per team (win 3 points, draw 1)
  // TODO: goalDifference = goalsFor - goalsAgainst
  // TODO: sort by points, then goalDifference, then goalsFor (all highest first), then team name A to Z
  throw new Error("not implemented yet");
}
