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
  return {
    sides: [Array(HOLES).fill(START_SEEDS), Array(HOLES).fill(START_SEEDS)],
    turn: 0,
    winner: null,
  };
}

export function other(player: Player): Player {
  return player === 0 ? 1 : 0;
}

export function nextHole(hole: number): number {
  return (hole + 1) % HOLES;
}

export function facingHole(hole: number): number | null {
  return hole < INNER_HOLES ? INNER_HOLES - 1 - hole : null;
}

export function movesFor(side: Side): number[] {
  return side.flatMap((seeds, hole) => (seeds >= 2 ? [hole] : []));
}

export function legalMoves(state: BaoState): number[] {
  return state.winner === null ? movesFor(state.sides[state.turn]) : [];
}

export function innerRowEmpty(side: Side): boolean {
  return side.slice(0, INNER_HOLES).every((seeds) => seeds === 0);
}

export function seedsOn(side: Side): number {
  return side.reduce((sum, seeds) => sum + seeds, 0);
}

export function play(state: BaoState, hole: number): MoveResult {
  if (state.winner !== null) {
    throw new Error("The game is over");
  }
  if (!Number.isInteger(hole) || hole < 0 || hole >= HOLES) {
    throw new Error(`No such hole: ${hole}`);
  }

  const me = state.turn;
  const them = other(me);
  const sides: [Side, Side] = [[...state.sides[0]], [...state.sides[1]]];
  const mine = sides[me];
  const theirs = sides[them];

  if (mine[hole] < 2) {
    throw new Error("Pick a hole with at least 2 seeds");
  }

  const steps: Step[] = [];
  let hand = mine[hole];
  mine[hole] = 0;
  steps.push({ kind: "lift", player: me, hole, seeds: hand });

  let position = hole;
  for (let lap = 1; ; lap++) {
    while (hand > 0) {
      position = nextHole(position);
      mine[position] += 1;
      hand -= 1;
      steps.push({ kind: "sow", player: me, hole: position });
    }

    // The last seed landed in an empty hole: the move is over.
    if (mine[position] === 1 || lap >= MAX_LAPS) {
      steps.push({ kind: "end", player: me, hole: position });
      break;
    }

    const facing = facingHole(position);
    if (facing !== null && theirs[facing] > 0) {
      // Capture: the opponent's facing seeds join the hole you landed in, and the move ends.
      const captured = theirs[facing];
      theirs[facing] = 0;
      mine[position] += captured;
      steps.push({ kind: "capture", player: them, hole: facing, seeds: captured });
      steps.push({ kind: "end", player: me, hole: position });
      break;
    } else {
      // Relay: pick up everything in this hole and keep sowing.
      hand = mine[position];
      mine[position] = 0;
      steps.push({ kind: "lift", player: me, hole: position, seeds: hand });
    }
  }

  let winner: Player | null = null;
  if (innerRowEmpty(theirs) || movesFor(theirs).length === 0) {
    winner = me;
  } else if (innerRowEmpty(mine)) {
    winner = them;
  }

  return { state: { sides, turn: them, winner }, steps };
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
