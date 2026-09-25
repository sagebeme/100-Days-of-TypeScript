import { getElement } from "./dom.ts";
import { fetchEvents, weekendEvents, formatPrice, formatWhen, type EventItem, type Fetcher } from "./events.ts";

export interface EventsOptions {
  url: string;
  today: string;
  fetchFn: Fetcher;
}

function eventCard(event: EventItem): HTMLLIElement {
  const item = document.createElement("li");
  const title = document.createElement("h2");
  title.textContent = event.title;
  const when = document.createElement("p");
  when.textContent = `${formatWhen(event)} · ${event.venue}`;
  const price = document.createElement("p");
  price.className = "price";
  price.textContent = formatPrice(event.priceKes);
  item.append(title, when, price);
  return item;
}

// Resolves once the first load has finished (whether it worked or not).
export async function mountEvents(root: ParentNode, options: EventsOptions): Promise<void> {
  const status = getElement(root, "#status", HTMLElement);
  const list = getElement(root, "#list", HTMLElement);
  const retry = getElement(root, "#retry", HTMLButtonElement);
  const freeOnly = getElement(root, "#free-only", HTMLInputElement);

  let events: EventItem[] = [];

  function draw(): void {
    const shown = freeOnly.checked ? events.filter((event) => event.priceKes === null) : events;
    list.replaceChildren(...shown.map(eventCard));
    if (shown.length === 0) {
      status.textContent = "Nothing on this weekend. Rest up.";
    } else {
      status.textContent = `${shown.length} ${shown.length === 1 ? "event" : "events"} this weekend`;
    }
  }

  async function load(): Promise<void> {
    status.textContent = "Loading…";
    retry.hidden = true;
    list.replaceChildren();
    try {
      events = weekendEvents(await fetchEvents(options.url, options.fetchFn), options.today);
      draw();
    } catch {
      status.textContent = "Couldn't load events. Check your connection and try again.";
      retry.hidden = false;
    }
  }

  freeOnly.addEventListener("change", draw);
  retry.addEventListener("click", () => void load());
  await load();
}
