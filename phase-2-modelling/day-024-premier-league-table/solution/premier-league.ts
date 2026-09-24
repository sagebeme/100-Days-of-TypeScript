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

function isGoalCount(value: unknown): boolean {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function isMatch(value: unknown): value is Match {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.home === "string" &&
    candidate.home.length > 0 &&
    typeof candidate.away === "string" &&
    candidate.away.length > 0 &&
    isGoalCount(candidate.homeGoals) &&
    isGoalCount(candidate.awayGoals)
  );
}

function toGoals(cell: string): number {
  return cell === "" ? NaN : Number(cell);
}

export function parseMatches(csv: string): Match[] {
  const lines = csv.split(/\r?\n/);
  const matches: Match[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") {
      continue;
    }

    const cells = line.split(",").map((cell) => cell.trim());
    const candidate =
      cells.length === 4
        ? { home: cells[0], away: cells[1], homeGoals: toGoals(cells[2]), awayGoals: toGoals(cells[3]) }
        : null;

    if (!isMatch(candidate)) {
      throw new Error(`Line ${i + 1} is not a valid match: ${line}`);
    }
    matches.push(candidate);
  }

  return matches;
}

export function buildTable(matches: Match[]): TableRow[] {
  const rows = new Map<string, TableRow>();

  const rowFor = (team: string): TableRow => {
    let row = rows.get(team);
    if (row === undefined) {
      row = { team, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 };
      rows.set(team, row);
    }
    return row;
  };

  const record = (team: string, scored: number, conceded: number): void => {
    const row = rowFor(team);
    row.played += 1;
    row.goalsFor += scored;
    row.goalsAgainst += conceded;
    row.goalDifference = row.goalsFor - row.goalsAgainst;
    if (scored > conceded) {
      row.won += 1;
      row.points += 3;
    } else if (scored === conceded) {
      row.drawn += 1;
      row.points += 1;
    } else {
      row.lost += 1;
    }
  };

  for (const match of matches) {
    record(match.home, match.homeGoals, match.awayGoals);
    record(match.away, match.awayGoals, match.homeGoals);
  }

  return [...rows.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.team.localeCompare(b.team),
  );
}
