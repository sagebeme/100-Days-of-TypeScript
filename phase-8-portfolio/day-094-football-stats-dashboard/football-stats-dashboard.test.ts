import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseResults, leagueTable, topScorers, headToHead, pointsRace, niceTicks, type Result } from "./starter/stats.ts";

const match = (date: string, home: string, away: string, homeGoals: number, awayGoals: number): Result => ({ date, home, away, homeGoals, awayGoals, scorers: [] });

describe("reading a season from CSV", () => {
  it("reads matches and scorers, in date order", () => {
    const { results, errors } = parseResults(
      "date,home,away,home_goals,away_goals,scorers\n2026-08-22,Lions,Sharks,1,0,Ian Otieno|Lions|44\n\n2026-08-15,Sharks,Lions,2,2,A|Sharks|3;B|Sharks|9;C|Lions|60;C|Lions|88\n",
    );
    expect(errors).toEqual([]);
    expect(results.map((r) => r.date)).toEqual(["2026-08-15", "2026-08-22"]);
    expect(results[1]).toEqual({ date: "2026-08-22", home: "Lions", away: "Sharks", homeGoals: 1, awayGoals: 0, scorers: [{ player: "Ian Otieno", team: "Lions", minute: 44 }] });
  });

  it("skips bad lines and says which, and why", () => {
    const { results, errors } = parseResults(
      [
        "date,home,away,home_goals,away_goals,scorers",
        "15/08/2026,Lions,Sharks,1,0,",
        "2026-08-15,Lions,Lions,1,0,",
        "2026-08-15,Lions,Sharks,one,0,",
        "2026-08-15,Lions,Sharks,1,0,X|Eagles|10",
        "2026-08-15,Lions,Sharks,2,0,X|Lions|10",
        "2026-08-15,Lions",
        "2026-08-15,Lions,Sharks,0,0,",
      ].join("\n"),
    );
    expect(results).toHaveLength(1);
    expect(errors).toEqual([
      'Line 2: "15/08/2026" isn\'t a date like 2026-08-15',
      "Line 3: a match needs two different teams",
      "Line 4: the score must be whole numbers",
      'Line 5: can\'t read the scorer "X|Eagles|10"',
      "Line 6: the scorers don't match the score",
      "Line 7: expected at least 5 columns, found 2",
    ]);
  });
});

describe("the table", () => {
  const results = [match("2026-08-15", "Lions", "Sharks", 2, 0), match("2026-08-22", "Sharks", "Eagles", 1, 1), match("2026-08-29", "Eagles", "Lions", 3, 1)];

  it("gives three points for a win, one for a draw, and counts everything else", () => {
    const table = leagueTable(results);
    expect(table.map((r) => [r.team, r.points])).toEqual([
      ["Eagles", 4],
      ["Lions", 3],
      ["Sharks", 1],
    ]);
    expect(table[1]).toEqual({ team: "Lions", played: 2, won: 1, drawn: 0, lost: 1, goalsFor: 3, goalsAgainst: 3, goalDifference: 0, points: 3, form: ["W", "L"] });
  });

  it("breaks ties on goal difference, then goals scored, then name", () => {
    const tied = leagueTable([match("2026-08-15", "B", "X", 3, 0), match("2026-08-15", "A", "Y", 1, 0), match("2026-08-15", "C", "Z", 4, 1), match("2026-08-15", "D", "W", 3, 0)]);
    expect(tied.slice(0, 4).map((r) => r.team)).toEqual(["C", "B", "D", "A"]);
  });

  it("shows the last five results as form, oldest first", () => {
    const seven = Array.from({ length: 7 }, (_, i) => match(`2026-09-0${i + 1}`, "Lions", "Sharks", i % 3, 1));
    expect(leagueTable(seven).find((r) => r.team === "Lions")!.form).toEqual(["W", "L", "D", "W", "L"]);
  });
});

describe("players and rivalries", () => {
  const goal = (player: string, team: string) => ({ player, team, minute: 10 });
  const results: Result[] = [
    { ...match("2026-08-15", "Lions", "Sharks", 3, 1), scorers: [goal("Ian", "Lions"), goal("Ian", "Lions"), goal("Ann", "Lions"), goal("Ian", "Sharks")] },
    { ...match("2026-08-22", "Sharks", "Lions", 1, 1), scorers: [goal("Bo", "Sharks"), goal("Ann", "Lions")] },
  ];

  it("ranks top scorers, keeping two players with the same name apart", () => {
    expect(topScorers(results)).toEqual([
      { player: "Ann", team: "Lions", goals: 2 },
      { player: "Ian", team: "Lions", goals: 2 },
      { player: "Bo", team: "Sharks", goals: 1 },
      { player: "Ian", team: "Sharks", goals: 1 },
    ]);
    expect(topScorers(results, 1)).toHaveLength(1);
  });

  it("sums up head to head, home and away", () => {
    expect(headToHead(results, "Sharks", "Lions")).toEqual({ played: 2, aWins: 0, bWins: 1, draws: 1, aGoals: 2, bGoals: 4 });
  });

  it("tracks a team's points match by match", () => {
    expect(pointsRace([...results, match("2026-08-29", "Eagles", "Lions", 0, 1)], "Lions")).toEqual([3, 4, 7]);
    expect(pointsRace(results, "Nobody")).toEqual([]);
  });
});

describe("chart ticks", () => {
  it("picks round steps that cover the highest value", () => {
    expect(niceTicks(34, 4)).toEqual([0, 10, 20, 30, 40]);
    expect(niceTicks(9, 5)).toEqual([0, 2, 4, 6, 8, 10]);
    expect(niceTicks(1200)).toEqual([0, 500, 1000, 1500]);
    expect(niceTicks(0)).toEqual([0]);
  });
});

describe("the sample season", () => {
  it("reads without errors, and every team plays every other home and away", () => {
    const { results, errors } = parseResults(readFileSync(join(import.meta.dirname, "starter/season.csv"), "utf8"));
    expect(errors).toEqual([]);
    const table = leagueTable(results);
    expect(table).toHaveLength(8);
    for (const row of table) expect(row.played).toBe(14);
  });
});
