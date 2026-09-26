// The page: yours to design. The table, the title race, the top scorers, and loading your own CSV.
//   npx vite phase-8-portfolio/day-094-football-stats-dashboard/starter
import seasonCsv from "./season.csv?raw";

document.getElementById("app")!.textContent = `${seasonCsv.trim().split("\n").length - 1} matches to show: over to you.`;
