import { play, legalMoves, type BaoState } from "./bao.ts";

// A greedy computer player: it wins if it can, otherwise it captures as many seeds as it can.
// Ties go to the lowest hole number, so it always makes the same choice in the same position.
export function chooseMove(state: BaoState): number {
  const moves = legalMoves(state);
  if (moves.length === 0) {
    throw new Error("No moves to choose from");
  }

  let best = moves[0];
  let bestScore = -1;
  for (const hole of moves) {
    const result = play(state, hole);
    if (result.state.winner === state.turn) {
      return hole;
    }
    const captured = result.steps.reduce((sum, step) => (step.kind === "capture" ? sum + step.seeds : sum), 0);
    if (captured > bestScore) {
      best = hole;
      bestScore = captured;
    }
  }
  return best;
}
