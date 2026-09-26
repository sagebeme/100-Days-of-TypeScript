// The page: yours to design. Pick two stages, show the trip step by step, and draw it on a map.
//   npx vite phase-8-portfolio/day-091-matatu-route-finder/starter
import { NAIROBI } from "./network.ts";

document.getElementById("app")!.textContent = `${NAIROBI.stages.length} stages, ${NAIROBI.routes.length} routes: over to you.`;
