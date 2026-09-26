// Already written: time the original report against yours, and check they agree.
//   node phase-8-portfolio/day-099-make-it-10x-faster/starter/bench.ts
// To see where the time goes, profile it, then open the .cpuprofile file in Chrome DevTools
// (Performance tab, "Load profile") or VS Code:
//   node --cpu-prof --cpu-prof-dir=/tmp/prof phase-8-portfolio/day-099-make-it-10x-faster/starter/bench.ts original
import { isDeepStrictEqual } from "node:util";
import { makeSeason } from "./season.ts";
import { seasonReport as original } from "./original-report.ts";
import { seasonReport as yours } from "./report.ts";

const only = process.argv[2]; // "original" or "yours" to run just one, for profiling
const time = (run: () => unknown) => {
  let best = Infinity;
  for (let i = 0; i < 3; i++) {
    const started = performance.now();
    run();
    best = Math.min(best, performance.now() - started);
  }
  return best;
};

console.log("orders   original       yours   faster   same answers");
for (const orders of [1000, 2000, 4000, 8000]) {
  const season = makeSeason(orders, { users: Math.round(orders * 0.4), events: 150, orders });
  const a = only === "yours" ? NaN : time(() => original(season));
  const b = only === "original" ? NaN : time(() => yours(season));
  const same = only ? "-" : isDeepStrictEqual(original(season), yours(season)) ? "yes" : "NO";
  console.log(`${String(orders).padStart(6)} ${a.toFixed(1).padStart(8)} ms ${b.toFixed(1).padStart(8)} ms ${(a / b).toFixed(0).padStart(7)}x   ${same}`);
}
