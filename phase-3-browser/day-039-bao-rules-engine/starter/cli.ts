// Already written: play Bao in the terminal against a computer that picks moves at random.
//   node phase-3-browser/day-039-bao-rules-engine/starter/cli.ts
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { createBao, play, legalMoves, seedsOn, formatBoard } from "./bao.ts";

const terminal = createInterface({ input: stdin, output: stdout });
let state = createBao();

console.log("Bao. You are player 0, at the bottom. Your inner row is holes 0-7 left to right,");
console.log("your outer row is holes 8-15 right to left. Type a hole number to move.\n");

while (state.winner === null) {
  console.log(formatBoard(state));
  const moves = legalMoves(state);

  if (state.turn === 0) {
    const answer = await terminal.question(`\nYour move (${moves.join(", ")}): `);
    const hole = Number(answer);
    if (!moves.includes(hole)) {
      console.log("You can't play that hole. Pick one from the list.\n");
      continue;
    }
    const result = play(state, hole);
    const captured = result.steps.filter((step) => step.kind === "capture").length;
    console.log(captured > 0 ? `Captured ${captured} time(s)!\n` : "\n");
    state = result.state;
  } else {
    const hole = moves[Math.floor(Math.random() * moves.length)];
    state = play(state, hole).state;
    console.log(`\nThe computer played hole ${hole}.\n`);
  }
}

console.log(formatBoard(state));
console.log(state.winner === 0 ? "\nYou win! Umeshinda!" : "\nThe computer wins this time.");
console.log(`Seeds: you ${seedsOn(state.sides[0])}, computer ${seedsOn(state.sides[1])}`);
terminal.close();
