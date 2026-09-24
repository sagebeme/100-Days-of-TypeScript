import { describe, it, expect } from "vitest";
import { isMatch, parseMatches, buildTable, type Match } from "./starter/premier-league.ts";

const csv = ["home,away,homeGoals,awayGoals", "Arsenal,Chelsea,2,1", "Chelsea,Liverpool,0,0", "Liverpool,Arsenal,1,3"].join(
  "\n",
);

describe("isMatch", () => {
  it("accepts a well-formed match", () => {
    expect(isMatch({ home: "Arsenal", away: "Chelsea", homeGoals: 2, awayGoals: 1 })).toBe(true);
  });

  it.each([
    ["null", null],
    ["a string", "Arsenal 2-1 Chelsea"],
    ["a missing team", { away: "Chelsea", homeGoals: 2, awayGoals: 1 }],
    ["an empty team name", { home: "", away: "Chelsea", homeGoals: 2, awayGoals: 1 }],
    ["goals that are NaN", { home: "A", away: "B", homeGoals: NaN, awayGoals: 1 }],
    ["negative goals", { home: "A", away: "B", homeGoals: -1, awayGoals: 1 }],
    ["fractional goals", { home: "A", away: "B", homeGoals: 1.5, awayGoals: 1 }],
    ["goals given as strings", { home: "A", away: "B", homeGoals: "2", awayGoals: 1 }],
  ])("rejects %s", (_label, value) => {
    expect(isMatch(value)).toBe(false);
  });

  it("narrows an unknown value to Match", () => {
    const value: unknown = { home: "A", away: "B", homeGoals: 0, awayGoals: 0 };
    if (isMatch(value)) {
      const goals: number = value.homeGoals + value.awayGoals;
      expect(goals).toBe(0);
    } else {
      expect.unreachable("a valid match was rejected");
    }
  });
});

describe("parseMatches", () => {
  it("turns CSV text into typed matches, skipping the header", () => {
    expect(parseMatches(csv)).toEqual([
      { home: "Arsenal", away: "Chelsea", homeGoals: 2, awayGoals: 1 },
      { home: "Chelsea", away: "Liverpool", homeGoals: 0, awayGoals: 0 },
      { home: "Liverpool", away: "Arsenal", homeGoals: 1, awayGoals: 3 },
    ]);
  });

  it("handles Windows line endings and blank lines", () => {
    const windowsCsv = "home,away,homeGoals,awayGoals\r\nArsenal,Chelsea,2,1\r\n\r\nChelsea,Arsenal,0,0\r\n";
    const matches = parseMatches(windowsCsv);
    expect(matches).toHaveLength(2);
    expect(matches[1]).toEqual({ home: "Chelsea", away: "Arsenal", homeGoals: 0, awayGoals: 0 });
  });

  it("trims spaces around cells", () => {
    expect(parseMatches("h,a,hg,ag\n Arsenal , Chelsea , 2 , 1 ")).toEqual([
      { home: "Arsenal", away: "Chelsea", homeGoals: 2, awayGoals: 1 },
    ]);
  });

  it("throws with the line number when goals are not numbers", () => {
    const bad = "home,away,homeGoals,awayGoals\nArsenal,Chelsea,2,1\nChelsea,Liverpool,two,0";
    expect(() => parseMatches(bad)).toThrow("Line 3 is not a valid match: Chelsea,Liverpool,two,0");
  });

  it("throws when a goals cell is empty", () => {
    expect(() => parseMatches("h,a,hg,ag\nA,B,,2")).toThrow("Line 2 is not a valid match");
  });

  it("throws when a row has the wrong number of cells", () => {
    expect(() => parseMatches("h,a,hg,ag\nA,B,1")).toThrow("Line 2 is not a valid match");
    expect(() => parseMatches("h,a,hg,ag\nA,B,1,2,3")).toThrow("Line 2 is not a valid match");
  });
});

describe("buildTable", () => {
  it("tallies results and orders the table", () => {
    expect(buildTable(parseMatches(csv))).toEqual([
      { team: "Arsenal", played: 2, won: 2, drawn: 0, lost: 0, goalsFor: 5, goalsAgainst: 2, goalDifference: 3, points: 6 },
      { team: "Chelsea", played: 2, won: 0, drawn: 1, lost: 1, goalsFor: 1, goalsAgainst: 2, goalDifference: -1, points: 1 },
      { team: "Liverpool", played: 2, won: 0, drawn: 1, lost: 1, goalsFor: 1, goalsAgainst: 3, goalDifference: -2, points: 1 },
    ]);
  });

  it("breaks a full tie by team name", () => {
    const matches: Match[] = [{ home: "Fulham", away: "Everton", homeGoals: 1, awayGoals: 1 }];
    expect(buildTable(matches).map((row) => row.team)).toEqual(["Everton", "Fulham"]);
  });

  it("breaks a points tie by goals scored when goal difference is equal", () => {
    const matches: Match[] = [
      { home: "Aston Villa", away: "Brighton", homeGoals: 1, awayGoals: 0 },
      { home: "Wolves", away: "Brentford", homeGoals: 3, awayGoals: 2 },
    ];
    expect(buildTable(matches).map((row) => row.team)).toEqual(["Wolves", "Aston Villa", "Brentford", "Brighton"]);
  });

  it("is empty when there are no matches", () => {
    expect(buildTable([])).toEqual([]);
  });
});
