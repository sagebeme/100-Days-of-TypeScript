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

export function holeLabel(player: PlayerText, hole: number, seeds: number): string {
  // TODO: "Your inner row, hole 3: 4 seeds" / "Computer's outer row, hole 12: 1 seed"
  throw new Error("not implemented yet");
}

export function describeMove(steps: Step[], players: [PlayerText, PlayerText]): string {
  // TODO: throw "A move starts with a lift" if the first step isn't a lift
  // TODO: "You sowed from hole 0." or "You sowed from hole 0 and captured 2 seeds." (1 seed, 2 seeds)
  throw new Error("not implemented yet");
}

export function turnText(state: BaoState, players: [PlayerText, PlayerText]): string {
  // TODO: the winner's `win` text, or the `turn` text of whoever is to move
  throw new Error("not implemented yet");
}
