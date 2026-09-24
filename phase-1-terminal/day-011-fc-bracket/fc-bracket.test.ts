import { describe, it, expect } from "vitest";
import { createMatchups } from "./starter/fc-bracket.ts";

describe("createMatchups", () => {
  it("shuffles deterministically when random() always returns 0", () => {
    expect(createMatchups(["A", "B", "C", "D"], () => 0)).toEqual([
      ["B", "C"],
      ["D", "A"],
    ]);
  });

  it("pairs every player exactly once with real randomness", () => {
    const players = ["Amina", "Kip", "Zawadi", "Baraka", "Njeri", "Otieno"];
    const matchups = createMatchups(players);

    expect(matchups).toHaveLength(3);
    expect(matchups.flat().sort()).toEqual([...players].sort());
  });

  it("does not mutate the array it was given", () => {
    const players = ["A", "B", "C", "D"];
    createMatchups(players, () => 0);
    expect(players).toEqual(["A", "B", "C", "D"]);
  });
});
