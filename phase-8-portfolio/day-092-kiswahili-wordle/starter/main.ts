// The page: yours to design. A 6 × 5 grid, an on-screen keyboard, and the result with the word's meaning.
//   npx vite phase-8-portfolio/day-092-kiswahili-wordle/starter
import { ANSWERS } from "./words.ts";

document.getElementById("app")!.textContent = `Neno: ${Object.keys(ANSWERS).length} words to guess. Over to you.`;
