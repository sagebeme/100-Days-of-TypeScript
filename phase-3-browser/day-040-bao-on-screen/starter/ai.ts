import { play, legalMoves, type BaoState } from "./bao.ts";

// A greedy computer player: it wins if it can, otherwise it captures as many seeds as it can.
// Ties go to the lowest hole number, so it always makes the same choice in the same position.
export function chooseMove(state: BaoState): number {
  // TODO: throw "No moves to choose from" if there are no legal moves
  // TODO: try every legal move with play() (it never changes `state`, so trying is free)
  //   - a move that makes state.turn the winner: return it straight away
  //   - otherwise keep the move whose "capture" steps add up to the most seeds
  //     (only replace the best on a strictly bigger number, so ties keep the lower hole)
  throw new Error("not implemented yet");
}
