import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import type { Browser, Page } from "playwright-core";
import { createSiteServer } from "./starter/serve.ts";
import { findChrome, launchBrowser } from "./starter/browser.ts";
import { EventsPage } from "./starter/events-page.ts";

const chrome = findChrome();
if (chrome === null) {
  console.warn("Day 51: no Chrome, Edge or Chromium found, so the browser tests are skipped. Set CHROME_PATH.");
}

describe("findChrome", () => {
  it("prefers CHROME_PATH when it points at a real file", () => {
    expect(findChrome({ CHROME_PATH: process.execPath })).toBe(process.execPath);
  });

  it("ignores a CHROME_PATH that doesn't exist", () => {
    expect(findChrome({ CHROME_PATH: "/no/such/chrome" })).toBe(chrome);
  });
});

describe.skipIf(chrome === null)("automating the practice site", { timeout: 30_000 }, () => {
  let server: Server;
  let url: string;
  let browser: Browser;
  let page: Page;
  let events: EventsPage;

  beforeAll(async () => {
    server = createSiteServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
    browser = await launchBrowser();
  });

  afterAll(async () => {
    await browser?.close();
    server?.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    events = new EventsPage(page, url);
    await events.open();
  });

  afterEach(async () => {
    await page.close();
  });

  it("shows why a browser is needed: the raw HTML has no events in it", async () => {
    const html = await (await fetch(url)).text();
    expect(html).not.toContain("Gengetone Night");
    expect(await events.cards.count()).toBe(0);
  });

  it("searches and waits for the results, however long they take", async () => {
    const status = await events.searchFor("music");
    expect(status).toBe("5 events found, showing 5");
    expect((await events.results()).map((e) => e.title)).toEqual([
      "Gengetone Night",
      "Sunday Picnic Jam",
      "Taarab by the Sea",
      "Lakeside Afrobeats",
      "Rooftop Listening Party",
    ]);
  });

  it("reads each card's details", async () => {
    await events.searchFor("picnic");
    expect(await events.results()).toEqual([
      { title: "Sunday Picnic Jam", details: "2026-10-04 · Karura Forest, Nairobi", price: "Free" },
    ]);
  });

  it("filters by city", async () => {
    expect(await events.searchFor("football", "Nairobi")).toBe("1 event found, showing 1");
    expect((await events.results())[0].title).toBe("Harambee Stars Screening");
  });

  it("presses Load more until everything is on the page", async () => {
    expect(await events.searchFor("")).toBe("12 events found, showing 5");
    const everything = await events.loadEverything();
    expect(everything).toHaveLength(12);
    expect(new Set(everything.map((e) => e.title)).size).toBe(12);
    expect(await events.loadMore.isVisible()).toBe(false);
  });

  it("returns an empty list when nothing matches", async () => {
    await events.search.fill("opera");
    await events.searchButton.click();
    await events.status.filter({ hasText: "No events found" }).waitFor();
    expect(await events.results()).toEqual([]);
  });

  it("finds elements by what a person sees, not by CSS classes", () => {
    const described = [events.search, events.city, events.searchButton, events.status, events.cards, events.loadMore]
      .map((locator) => locator.toString())
      .join("\n");
    expect(described).toContain("getByLabel");
    expect(described).toContain("getByRole");
    expect(described).not.toContain("TODO");
  });

  it("saves a screenshot", async () => {
    await events.searchFor("comedy");
    const dir = await mkdtemp(join(tmpdir(), "shot-"));
    try {
      const path = join(dir, "results.png");
      await events.screenshot(path);
      const png = await readFile(path);
      expect(png.subarray(1, 4).toString()).toBe("PNG");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
