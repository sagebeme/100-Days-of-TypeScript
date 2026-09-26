// The page: yours to design. Draw the race from race.ts, and turn key presses into actions.
//   npx vite phase-8-portfolio/day-082-typing-race/starter
import { newRace, passageFor } from "./race.ts";

const race = newRace(passageFor(new Date()));
document.getElementById("app")!.textContent = race.target;
