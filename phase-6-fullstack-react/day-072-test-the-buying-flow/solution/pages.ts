import type { Locator, Page } from "playwright-core";

// Page objects: one class per page, holding HOW to find things, so the tests only say WHAT happens.
// When the markup changes, one locator changes here, not every test that uses it.
//
// Every locator finds things the way a person does: by role and accessible name ("the Buy with
// M-Pesa button"), never by CSS class. That makes the tests an accessibility check too: if a screen
// reader can't find the Buy button, neither can the test.

export class WhatsOnPage {
  readonly page: Page;
  readonly url: string;
  readonly region: Locator;

  constructor(page: Page, url: string) {
    this.page = page;
    this.url = url;
    this.region = page.getByRole("region", { name: "What's on" });
  }

  async open(): Promise<void> {
    await this.page.goto(this.url);
    await this.region.getByRole("article").first().waitFor();
  }

  card(title: string): Locator {
    return this.region.getByRole("article", { name: title });
  }

  async titles(): Promise<string[]> {
    return this.region.getByRole("heading", { level: 3 }).allTextContents();
  }

  // "Only 14 left", "On sale", "Cancelled"...
  async seatsFor(title: string): Promise<string> {
    return (await this.card(title).getByRole("status").textContent()) ?? "";
  }

  async openEvent(title: string): Promise<EventPage> {
    await this.card(title).getByRole("link", { name: title }).click();
    const event = new EventPage(this.page);
    await event.heading.waitFor();
    return event;
  }
}

export class EventPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly seats: Locator;
  readonly quantity: Locator;
  readonly phone: Locator;
  readonly buyButton: Locator;
  readonly alert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1 });
    this.seats = page.getByRole("status");
    this.quantity = page.getByRole("combobox", { name: "Tickets" });
    this.phone = page.getByRole("textbox", { name: "M-Pesa phone number" });
    this.buyButton = page.getByRole("button", { name: "Buy with M-Pesa" });
    this.alert = page.getByRole("alert");
  }

  // Fills in the form and presses Buy. Doesn't wait for what happens next: the test decides.
  async buy(order: { quantity: number; phone: string }): Promise<void> {
    await this.quantity.selectOption(String(order.quantity));
    await this.phone.fill(order.phone);
    await this.buyButton.click();
  }

  async seatsText(): Promise<string> {
    return (await this.seats.textContent()) ?? "";
  }
}

export class OrderPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly tickets: Locator;
  readonly tryAgain: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1 });
    this.tickets = page.getByRole("region").getByRole("listitem");
    this.tryAgain = page.getByRole("link", { name: "Try again" });
  }

  // The order's number, from the address: #/orders/7 -> 7.
  id(): number {
    const match = /#\/orders\/(\d+)$/.exec(this.page.url());
    if (!match) throw new Error(`Not on an order page: ${this.page.url()}`);
    return Number(match[1]);
  }

  // Waits (up to the timeout) for the heading to say this. The page polls on its own; the test
  // just waits for the result, however many polls it takes. Never a fixed sleep.
  async waitForHeading(text: string, timeout = 10_000): Promise<void> {
    await this.page.getByRole("heading", { level: 1, name: text }).waitFor({ timeout });
  }

  async ticketCodes(): Promise<string[]> {
    return this.tickets.allTextContents();
  }
}
