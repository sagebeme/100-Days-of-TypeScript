import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { Browser, BrowserContext, Page } from "playwright-core";
import { startApp, type RunningApp } from "./starter/server.ts";
import { findChrome, launchBrowser } from "./starter/browser.ts";
import { WhatsOnPage, EventPage, OrderPage } from "./starter/pages.ts";

// End-to-end: the real app, in a real browser, clicked the way a fan clicks it. The API is a test
// double (starter/app/test-api.ts), so each test sets up exactly the world it needs.
const chrome = findChrome();
if (chrome === null) console.warn("Day 72: no Chrome, Edge or Chromium found, so the browser tests are skipped. Set CHROME_PATH.");

describe.skipIf(chrome === null)("buying tickets, end to end", { timeout: 45_000 }, () => {
  let app: RunningApp;
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let whatsOn: WhatsOnPage;

  beforeAll(async () => {
    [app, browser] = await Promise.all([startApp(), launchBrowser()]);
  }, 60_000);

  afterAll(async () => {
    await browser?.close();
    await app?.close();
  });

  beforeEach(async () => {
    await app.control("reset");
    context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
    page = await context.newPage();
    page.setDefaultTimeout(10_000);
    whatsOn = new WhatsOnPage(page, app.url);
  });

  // A failed end-to-end test is hard to understand from a message alone: keep a screenshot of the moment.
  afterEach(async (test) => {
    if (test.task.result?.state === "fail") {
      const folder = join(import.meta.dirname, "test-results");
      await mkdir(folder, { recursive: true });
      await page.screenshot({ path: join(folder, `${test.task.name.replace(/\W+/g, "-")}.png`), fullPage: true });
    }
    await context.close();
  });

  it("lists what's on, with live seat counts", async () => {
    await whatsOn.open();
    expect(await whatsOn.titles()).toEqual(["Jioni Jazz Night", "Gengetone Block Party", "Laugh Industry Live"]);
    expect(await whatsOn.seatsFor("Gengetone Block Party")).toBe("Only 14 left");
    expect(await whatsOn.seatsFor("Laugh Industry Live")).toBe("Cancelled");
  });

  it("buys two tickets: order, M-Pesa prompt, payment, tickets", async () => {
    await whatsOn.open();
    const event = await whatsOn.openEvent("Gengetone Block Party");
    expect(await event.heading.textContent()).toBe("Gengetone Block Party");
    expect(await event.seatsText()).toBe("Only 14 left");

    await event.buy({ quantity: 2, phone: "0712 345 678" });
    const order = new OrderPage(page);
    await order.waitForHeading("Enter your M-Pesa PIN");
    expect(await page.getByText("KES 1,600").count()).toBe(1);

    await app.control(`orders/${order.id()}/settle`, { outcome: "paid" }); // the fan types their PIN
    await order.waitForHeading("You're in!");
    expect(await order.ticketCodes()).toEqual(["T1-AAAAAAAAAAAAAAA1", "T2-AAAAAAAAAAAAAAA2"]);

    await page.goBack();
    await page.goBack();
    await whatsOn.region.waitFor();
    expect(await whatsOn.seatsFor("Gengetone Block Party")).toBe("Only 12 left");
  });

  it("lets the fan try again after cancelling on their phone, with the seats back on sale", async () => {
    await whatsOn.open();
    const event = await whatsOn.openEvent("Gengetone Block Party");
    await event.buy({ quantity: 3, phone: "0712345678" });
    const order = new OrderPage(page);
    await order.waitForHeading("Enter your M-Pesa PIN");

    await app.control(`orders/${order.id()}/settle`, { outcome: "cancelled" });
    await order.waitForHeading("Payment didn't go through");
    expect(await page.getByText("You cancelled the payment on your phone.").count()).toBe(1);

    await order.tryAgain.click();
    await event.heading.waitFor();
    await expect.poll(() => event.seatsText()).toBe("Only 14 left");
  });

  it("explains when the seats sold out while the fan was deciding", async () => {
    await whatsOn.open();
    const event = await whatsOn.openEvent("Gengetone Block Party");
    await app.control("seats", { eventId: 2, available: 1 }); // everyone else was quicker
    await event.buy({ quantity: 2, phone: "0712 345 678" });
    await event.alert.waitFor();
    expect(await event.alert.textContent()).toBe("Only 1 left");
    expect(page.url()).toMatch(/#\/events\/2$/); // still here, able to change the order
    expect(await event.buyButton.isEnabled()).toBe(true);
  });

  it("shows the server's reason for a phone number it won't accept", async () => {
    await whatsOn.open();
    const event = await whatsOn.openEvent("Jioni Jazz Night");
    await event.buy({ quantity: 1, phone: "0800 123 456" });
    await event.alert.waitFor();
    expect(await event.alert.textContent()).toBe("Enter a Safaricom number like 0712 345 678");
  });

  it("gets past a server hiccup without the fan noticing", async () => {
    await app.control("fail-next", { status: 503 });
    await whatsOn.open(); // the first request fails, the automatic retry works
    expect(await whatsOn.titles()).toHaveLength(3);
    expect(await page.getByRole("alert").count()).toBe(0);
  });

  it("doesn't sell tickets for a cancelled event", async () => {
    await whatsOn.open();
    const event = await whatsOn.openEvent("Laugh Industry Live");
    expect(await event.buyButton.count()).toBe(0);
    expect(await page.getByText("This event was cancelled.").count()).toBe(1);
  });

  it("can be done with the keyboard alone", async () => {
    await whatsOn.open();
    await whatsOn.card("Jioni Jazz Night").getByRole("link").focus();
    await page.keyboard.press("Enter");
    const event = new EventPage(page);
    await event.heading.waitFor();

    await event.quantity.focus();
    await page.keyboard.press("ArrowDown"); // 2 tickets
    await page.keyboard.press("Tab");
    expect(await event.phone.evaluate((box) => box === document.activeElement)).toBe(true);
    await page.keyboard.type("0712 345 678");
    await page.keyboard.press("Enter"); // submits the form

    const order = new OrderPage(page);
    await order.waitForHeading("Enter your M-Pesa PIN");
    expect(await page.getByText("KES 5,000").count()).toBe(1);
  });

  it("fits a phone screen, with nothing wider than it", async () => {
    await page.setViewportSize({ width: 360, height: 740 });
    const tooWide = () => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    await whatsOn.open();
    expect(await tooWide()).toBe(false);
    const event = await whatsOn.openEvent("Gengetone Block Party");
    expect(await tooWide()).toBe(false);
    const box = await event.buyButton.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44); // big enough for a thumb
  });
});
