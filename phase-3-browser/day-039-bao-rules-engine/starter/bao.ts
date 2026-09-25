// Bao for learners: a 4 x 8 board, two rows of 8 holes each.
//
// Each player's 16 holes are numbered round their own two rows:
//   0-7   the inner row (the one facing the opponent), left to right as that player sees it
//   8-15  the outer row, right to left, so hole 15 is next to hole 0 and sowing goes round in a loop
export const HOLES = 16;
export const INNER_HOLES = 8;
export const START_SEEDS = 2;
export const MAX_LAPS = 200;

export type Player = 0 | 1;
export type Side = number[];

export interface BaoState {
  sides: [Side, Side];
  turn: Player;
  winner: Player | null;
}

// Everything that happens during a move, in order, so a screen can replay it (Day 40).
export type Step =
  | { kind: "lift"; player: Player; hole: number; seeds: number }
  | { kind: "sow"; player: Player; hole: number }
  | { kind: "capture"; player: Player; hole: number; seeds: number } // taken from `player`'s hole
  | { kind: "end"; player: Player; hole: number };

export interface MoveResult {
  state: BaoState;
  steps: Step[];
}

export function createBao(): BaoState {
  // TODO: both sides full of START_SEEDS (each side its own array), player 0 to move, no winner
  throw new Error("not implemented yet");
}

export function other(player: Player): Player {
  return player === 0 ? 1 : 0;
}

export function nextHole(hole: number): number {
  return (hole + 1) % HOLES;
}

export function facingHole(hole: number): number | null {
  // TODO: inner hole h faces the opponent's hole 7 - h; outer holes (8-15) face nothing
  throw new Error("not implemented yet");
}

export function movesFor(side: Side): number[] {
  // TODO: the holes with 2 or more seeds, in order
  throw new Error("not implemented yet");
}

export function legalMoves(state: BaoState): number[] {
  // TODO: movesFor(whoever's turn it is), or [] once there's a winner
  throw new Error("not implemented yet");
}

export function innerRowEmpty(side: Side): boolean {
  // TODO: true if holes 0-7 are all empty
  throw new Error("not implemented yet");
}

export function seedsOn(side: Side): number {
  // TODO: the total number of seeds on this side
  throw new Error("not implemented yet");
}

export function play(state: BaoState, hole: number): MoveResult {
  // TODO: throw "The game is over" / `No such hole: ${hole}` / "Pick a hole with at least 2 seeds"
  // TODO: copy both sides, so `state` never changes
  // TODO: lift the seeds (a "lift" step), then sow one per hole with nextHole (a "sow" step each)
  // TODO: then, where the last seed landed:
  //   - it was empty (now 1 seed), or MAX_LAPS reached  -> an "end" step, and stop
  //   - inner row, and the facing opponent hole has seeds -> "capture": move them into the hole
  //                                                          you landed in, then an "end" step, and stop
  //   - otherwise                                         -> "lift" this hole into your hand, and sow again
  // TODO: the winner: opponent's inner row empty or no moves -> you; else your inner row empty -> them
  // TODO: return the new state (turn passes to the other player) and the steps
  throw new Error("not implemented yet");
}

// A plain-text board for the terminal, with player 0 at the bottom.
export function formatBoard(state: BaoState): string {
  const cell = (seeds: number) => String(seeds).padStart(3);
  const [bottom, top] = state.sides;
  const columns = [0, 1, 2, 3, 4, 5, 6, 7];
  const rows = [
    columns.map((col) => top[col + 8]), // player 1 outer
    columns.map((col) => top[7 - col]), // player 1 inner
    columns.map((col) => bottom[col]), // player 0 inner
    columns.map((col) => bottom[15 - col]), // player 0 outer
  ];
  const lines = rows.map((row) => row.map(cell).join(""));
  return [lines[0], lines[1], "-".repeat(24), lines[2], lines[3]].join("\n");
}
