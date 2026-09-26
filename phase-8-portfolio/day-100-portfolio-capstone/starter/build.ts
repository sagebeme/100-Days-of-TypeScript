// Already written: build the site into dist/, ready for any static host.
//   node phase-8-portfolio/day-100-portfolio-capstone/starter/build.ts [output folder] [base path]
// Then look at it: npx serve phase-8-portfolio/day-100-portfolio-capstone/starter/dist
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { projects, site } from "./content.ts";
import { buildSite, ContentProblems } from "./site.ts";

const outDir = process.argv[2] ?? join(import.meta.dirname, "dist");
const config = process.argv[3] ? { ...site, basePath: process.argv[3] } : site;

let files: Map<string, string>;
try {
  files = buildSite(config, projects);
} catch (error) {
  if (!(error instanceof ContentProblems)) throw error;
  console.error(error.message);
  process.exit(1);
}
await rm(outDir, { recursive: true, force: true });
for (const [path, content] of files) {
  await mkdir(dirname(join(outDir, path)), { recursive: true });
  await writeFile(join(outDir, path), content);
}
console.log(`Built ${files.size} files into ${outDir}`);
