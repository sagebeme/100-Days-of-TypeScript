// Already written: search the practice site with a real browser, collect every result, save a screenshot.
//   node phase-4-internet/day-051-browser-automation/starter/cli.ts music
//   node phase-4-internet/day-051-browser-automation/starter/cli.ts football Nairobi --show   (watch it work)
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createSiteServer } from "./serve.ts";
import { launchBrowser } from "./browser.ts";
import { EventsPage } from "./events-page.ts";

const args = process.argv.slice(2);
const show = args.includes("--show");
const [words = "", city = ""] = args.filter((arg) => arg !== "--show");

const server = createSiteServer();
await new Promise<void>((resolve) => server.listen(0, resolve));
const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;

const browser = await launchBrowser({ headless: !show });
try {
  const events = new EventsPage(await browser.newPage(), url);
  await events.open();
  console.log(await events.searchFor(words, city));
  for (const event of await events.loadEverything()) {
    console.log(`  ${event.title.padEnd(26)} ${event.details.padEnd(44)} ${event.price}`);
  }
  const shot = join(import.meta.dirname, "results.png");
  await events.screenshot(shot);
  console.log(`\nScreenshot saved to ${shot}`);
} finally {
  await browser.close();
  server.close();
}
