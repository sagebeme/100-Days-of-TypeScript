// Copies every file in each day's solution/ over the matching file in its starter/,
// so CI can run the exact same tests against the reference solution instead of the
// TODO stub. Only meant to run in a throwaway CI checkout - never run this against
// your own work, it overwrites starter/ with no backup.
import { readdirSync, statSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
let filesCopied = 0;
let daysTouched = 0;

function findDayFolders(dir: string): string[] {
  const days: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (!entry.startsWith("phase-")) continue;
    const phaseDir = join(dir, entry);
    if (!statSync(phaseDir).isDirectory()) continue;
    for (const dayEntry of readdirSync(phaseDir)) {
      if (!dayEntry.startsWith("day-")) continue;
      const dayDir = join(phaseDir, dayEntry);
      if (statSync(dayDir).isDirectory()) {
        days.push(dayDir);
      }
    }
  }
  return days;
}

for (const dayDir of findDayFolders(root)) {
  const solutionDir = join(dayDir, "solution");
  const starterDir = join(dayDir, "starter");

  let solutionFiles: string[];
  try {
    // Relative paths, subfolders included: a Next.js day keeps its solutions in app/events/[id]/ and so on.
    solutionFiles = readdirSync(solutionDir, { recursive: true, encoding: "utf8" }).filter((file) => statSync(join(solutionDir, file)).isFile());
  } catch {
    continue; // no solution/ folder for this day yet
  }

  let touchedThisDay = false;
  for (const file of solutionFiles) {
    const solutionPath = join(solutionDir, file);
    const starterPath = join(starterDir, file);
    try {
      statSync(starterPath);
    } catch {
      console.warn(`Skipping ${solutionPath}: no matching file at ${starterPath}`);
      continue;
    }
    copyFileSync(solutionPath, starterPath);
    filesCopied += 1;
    touchedThisDay = true;
  }
  if (touchedThisDay) daysTouched += 1;
}

console.log(`Applied solutions: ${filesCopied} file(s) across ${daysTouched} day(s).`);
