// Already written: track prices from a saved page (or a URL) and show what changed.
//   node phase-4-internet/day-050-price-tracker/starter/cli.ts pages/sneakers-yesterday.html 2026-09-25
//   node phase-4-internet/day-050-price-tracker/starter/cli.ts pages/sneakers-today.html 2026-09-26
//   node phase-4-internet/day-050-price-tracker/starter/cli.ts pages/sneakers-redesigned.html 2026-09-27
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseListing, missingSelectors } from "./scrape.ts";
import { record, compare, formatTable, type History } from "./history.ts";

const [source = "pages/sneakers-today.html", date = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);
const historyPath = join(import.meta.dirname, "prices.json");
const pageUrl = source.startsWith("http") ? source : "https://duka.example/sneakers";

const html = source.startsWith("http")
  ? await (await fetch(source, { headers: { "User-Agent": "PriceTracker/1.0 (you@example.com)" } })).text()
  : await readFile(join(import.meta.dirname, source), "utf8");

const missing = missingSelectors(html);
if (missing.length > 0) {
  console.error(`The page has changed: nothing matches ${missing.join(", ")}. Update SELECTORS in scrape.ts.`);
  process.exit(1);
}

let history: History = {};
try {
  history = JSON.parse(await readFile(historyPath, "utf8"));
} catch {
  // First run: no history yet.
}

const products = parseListing(html, pageUrl);
history = record(history, products, date);
await writeFile(historyPath, JSON.stringify(history, null, 2));
console.log(`${date}: ${products.length} products\n`);
console.log(formatTable(compare(history, products, date)));
