// The page: yours to design. Draw the board, and let people move cards by dragging AND with the keyboard.
//   npx vite phase-8-portfolio/day-089-project-board/starter
import { emptyBoard } from "./board.ts";

document.getElementById("board")!.textContent = emptyBoard().columns.map((c) => c.title).join(" · ");
