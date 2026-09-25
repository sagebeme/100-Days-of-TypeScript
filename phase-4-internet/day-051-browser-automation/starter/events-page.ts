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
    // TODO: find each thing the way a person would, by label, role and name (see the README):
    //   search: the field labelled "Search events"      city: the field labelled "City"
    //   searchButton: the button named "Search"          status: the element with role "status"
    //   cards: the list items inside the list named "Events"
    //   loadMore: the button named "Load more"
    this.search = page.locator("TODO");
    this.city = page.locator("TODO");
    this.searchButton = page.locator("TODO");
    this.status = page.locator("TODO");
    this.cards = page.locator("TODO");
    this.loadMore = page.locator("TODO");
  }

  async open(): Promise<void> {
    await this.page.goto(this.baseUrl);
  }

  async searchFor(words: string, city = ""): Promise<string> {
    // TODO: fill the search box, pick the city, click Search.
    // TODO: then wait until the status says "found" (status.filter({ hasText: /found/ }).waitFor()),
    //   and return the status text. Never a fixed wait: the site takes a different time on every search.
    throw new Error("not implemented yet");
  }

  async results(): Promise<EventResult[]> {
    // TODO: for each card: the heading's text, the .meta text and the .price text, trimmed
    throw new Error("not implemented yet");
  }

  async loadEverything(): Promise<EventResult[]> {
    // TODO: while "Load more" is visible: count the cards, click it, and wait for the card after the
    //   last one to appear (cards.nth(count).waitFor()). Then return all the results.
    throw new Error("not implemented yet");
  }

  async screenshot(path: string): Promise<void> {
    await this.page.screenshot({ path, fullPage: true });
  }
}
