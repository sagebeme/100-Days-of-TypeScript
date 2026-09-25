import type { Page, Locator } from "playwright-core";

export interface EventResult {
  title: string;
  details: string; // "2026-10-03 · Alchemist, Nairobi"
  price: string; // "KES 1,000" or "Free"
}

// A "page object": everything the automation knows about this page lives here.
// Tests and scripts say what to do ("search for music in Nairobi"), never how to find the button.
export class EventsPage {
  readonly search: Locator;
  readonly city: Locator;
  readonly searchButton: Locator;
  readonly status: Locator;
  readonly cards: Locator;
  readonly loadMore: Locator;

  readonly page: Page;
  readonly baseUrl: string;

  constructor(page: Page, baseUrl: string) {
    this.page = page;
    this.baseUrl = baseUrl;
    // Find things the way a person does: by their label, role and name. Not by CSS classes that change.
    this.search = page.getByLabel("Search events");
    this.city = page.getByLabel("City");
    this.searchButton = page.getByRole("button", { name: "Search" });
    this.status = page.getByRole("status");
    this.cards = page.getByRole("list", { name: "Events" }).getByRole("listitem");
    this.loadMore = page.getByRole("button", { name: "Load more" });
  }

  async open(): Promise<void> {
    await this.page.goto(this.baseUrl);
  }

  // Search, then wait until the site says it has finished: never a fixed sleep.
  async searchFor(words: string, city = ""): Promise<string> {
    await this.search.fill(words);
    await this.city.selectOption(city);
    await this.searchButton.click();
    await this.status.filter({ hasText: /found/ }).waitFor();
    return (await this.status.textContent()) ?? "";
  }

  async results(): Promise<EventResult[]> {
    const results: EventResult[] = [];
    for (const card of await this.cards.all()) {
      results.push({
        title: (await card.getByRole("heading").textContent())?.trim() ?? "",
        details: (await card.locator(".meta").textContent())?.trim() ?? "",
        price: (await card.locator(".price").textContent())?.trim() ?? "",
      });
    }
    return results;
  }

  // Keep pressing "Load more" until it goes away, waiting each time for the new cards to arrive.
  async loadEverything(): Promise<EventResult[]> {
    while (await this.loadMore.isVisible()) {
      const before = await this.cards.count();
      await this.loadMore.click();
      await this.cards.nth(before).waitFor();
    }
    return this.results();
  }

  async screenshot(path: string): Promise<void> {
    await this.page.screenshot({ path, fullPage: true });
  }
}
