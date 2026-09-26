import type { Locator, Page } from "playwright-core";

// Page objects: one class per page, holding HOW to find things, so the tests only say WHAT happens.
// When the markup changes, one locator changes here, not every test that uses it.
//
// Find everything the way a person does: by role and accessible name, never by CSS class.
//   page.getByRole("button", { name: "Buy with M-Pesa" })
//   page.getByRole("region", { name: "What's on" }).getByRole("article", { name: "Jioni Jazz Night" })
// That makes the tests an accessibility check too: if a screen reader can't find the Buy button,
// neither can the test. (Seat badges are role="status"; the order page is a region with list items.)
const todo = (what: string): never => {
  throw new Error(`TODO: ${what}`);
};

export class WhatsOnPage {
  readonly page: Page;
  readonly url: string;
  readonly region: Locator; // TODO: the region named "What's on"

  constructor(page: Page, url: string) {
    this.page = page;
    this.url = url;
    this.region = page.locator("TODO");
  }

  // TODO: go to the url, then wait for the first article in the region (the events have loaded).
  async open(): Promise<void> {
    todo("WhatsOnPage.open");
  }

  // TODO: the article named after the event.
  card(title: string): Locator {
    return todo(`WhatsOnPage.card(${title})`);
  }

  // TODO: the text of every level-3 heading in the region.
  async titles(): Promise<string[]> {
    return todo("WhatsOnPage.titles");
  }

  // TODO: the text of the card's status ("Only 14 left", "Cancelled"...).
  async seatsFor(title: string): Promise<string> {
    return todo(`WhatsOnPage.seatsFor(${title})`);
  }

  // TODO: click the card's link, then wait for the event page's heading. Return an EventPage.
  async openEvent(title: string): Promise<EventPage> {
    return todo(`WhatsOnPage.openEvent(${title})`);
  }
}

export class EventPage {
  readonly page: Page;
  readonly heading: Locator; // TODO: the level-1 heading
  readonly seats: Locator; // TODO: the status
  readonly quantity: Locator; // TODO: the combobox named "Tickets"
  readonly phone: Locator; // TODO: the textbox named "M-Pesa phone number"
  readonly buyButton: Locator; // TODO: the button named "Buy with M-Pesa"
  readonly alert: Locator; // TODO: the alert

  constructor(page: Page) {
    this.page = page;
    this.heading = this.seats = this.quantity = this.phone = this.buyButton = this.alert = page.locator("TODO");
  }

  // TODO: choose the quantity, fill in the phone, press Buy. Don't wait for what happens next.
  async buy(order: { quantity: number; phone: string }): Promise<void> {
    todo(`EventPage.buy(${order.quantity})`);
  }

  // TODO: the text of the seats status.
  async seatsText(): Promise<string> {
    return todo("EventPage.seatsText");
  }
}

export class OrderPage {
  readonly page: Page;
  readonly heading: Locator; // TODO: the level-1 heading
  readonly tickets: Locator; // TODO: the list items in the region
  readonly tryAgain: Locator; // TODO: the link named "Try again"

  constructor(page: Page) {
    this.page = page;
    this.heading = this.tickets = this.tryAgain = page.locator("TODO");
  }

  // TODO: the order's number, from the address: #/orders/7 -> 7. Throw if it isn't an order page.
  id(): number {
    return todo("OrderPage.id");
  }

  // TODO: wait (up to `timeout`) for a level-1 heading with this text. The page polls by itself;
  // just wait for the result. Never a fixed sleep.
  async waitForHeading(text: string, timeout = 10_000): Promise<void> {
    todo(`OrderPage.waitForHeading(${text}, ${timeout})`);
  }

  // TODO: the text of every ticket.
  async ticketCodes(): Promise<string[]> {
    return todo("OrderPage.ticketCodes");
  }
}
