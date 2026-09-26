// Already written: build the blog: every .md file in posts/ becomes a page in dist/.
//   node phase-8-portfolio/day-081-blog-generator/starter/build.ts [posts folder] [output folder]
import { readdir, readFile, mkdir, writeFile, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { parsePost } from "./posts.ts";
import { buildSite } from "./site.ts";

const postsDir = process.argv[2] ?? join(import.meta.dirname, "posts");
const outDir = process.argv[3] ?? join(import.meta.dirname, "dist");
const config = { title: "Matatu Diaries", description: "Notes on Nairobi: food, music and getting around.", url: "https://matatu-diaries.example", author: "Amina Otieno" };

const names = (await readdir(postsDir)).filter((n) => n.endsWith(".md"));
const posts = await Promise.all(names.map(async (name) => parsePost(name, await readFile(join(postsDir, name), "utf8"))));
const files = buildSite(posts, config);
await rm(outDir, { recursive: true, force: true });
for (const [path, content] of files) {
  await mkdir(dirname(join(outDir, path)), { recursive: true });
  await writeFile(join(outDir, path), content);
}
console.log(`Built ${files.size} files from ${posts.length} posts into ${outDir}`);
