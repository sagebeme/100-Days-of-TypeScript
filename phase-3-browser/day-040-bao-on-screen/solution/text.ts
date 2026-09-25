import { INNER_HOLES, type BaoState, type Step } from "./bao.ts";

export type Opponent = "computer" | "friend";

// Everything the page says about a player, so the wording lives in one place.
export interface PlayerText {
  name: string; // "You"
  side: string; // "Your"
  turn: string; // "Your turn"
  win: string; // "You win! Umeshinda!"
}

export const PLAYERS: Record<Opponent, [PlayerText, PlayerText]> = {
  computer: [
    { name: "You", side: "Your", turn: "Your turn.", win: "You win! Umeshinda!" },
    { name: "Computer", side: "Computer's", turn: "Computer is thinking…", win: "The computer wins this time." },
  ],
  friend: [
    { name: "Player 1", side: "Player 1's", turn: "Player 1's turn.", win: "Player 1 wins!" },
    { name: "Player 2", side: "Player 2's", turn: "Player 2's turn.", win: "Player 2 wins!" },
  ],
};

export function isOpponent(value: string): value is Opponent {
  return value === "computer" || value === "friend";
}

function seedWord(count: number): string {
  return count === 1 ? "1 seed" : `${count} seeds`;
}

export function holeLabel(player: PlayerText, hole: number, seeds: number): string {
  const row = hole < INNER_HOLES ? "inner" : "outer";
  return `${player.side} ${row} row, hole ${hole}: ${seedWord(seeds)}`;
}

export function describeMove(steps: Step[], players: [PlayerText, PlayerText]): string {
  const first = steps[0];
  if (first === undefined || first.kind !== "lift") {
    throw new Error("A move starts with a lift");
  }
  const captured = steps.reduce((sum, step) => (step.kind === "capture" ? sum + step.seeds : sum), 0);
  const sowed = `${players[first.player].name} sowed from hole ${first.hole}`;
  return captured > 0 ? `${sowed} and captured ${seedWord(captured)}.` : `${sowed}.`;
}

export function turnText(state: BaoState, players: [PlayerText, PlayerText]): string {
  return state.winner === null ? players[state.turn].turn : players[state.winner].win;
}
