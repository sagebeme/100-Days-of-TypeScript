// The page: yours to design. Draw the board from game.ts, and let a person play the computer.
//   npx vite phase-8-portfolio/day-083-connect-four-ai/starter
import { emptyBoard } from "./game.ts";

document.getElementById("app")!.textContent = `${emptyBoard().length} rows: over to you.`;
