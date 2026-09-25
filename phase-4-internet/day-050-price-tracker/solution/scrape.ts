import { Window } from "happy-dom";

export interface Product {
  sku: string;
  name: string;
  priceKes: number;
  wasKes: number | null; // the crossed-out price, if the shop shows one
  inStock: boolean;
  url: string;
}

// Every selector in one place. When the shop redesigns, this is the only thing that changes.
export const SELECTORS = {
  card: "article.product-card",
  name: ".product-name",
  price: ".price-now",
  was: ".price-old",
  soldOut: ".badge-sold-out",
  link: "a.product-link",
} as const;

// A real HTML parser, not regular expressions. Nothing on the page is run or downloaded.
export function parseHtml(html: string): Document {
  const window = new Window({
    settings: {
      disableJavaScriptEvaluation: true,
      disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true,
      handleDisabledFileLoadingAsSuccess: true,
    },
  });
  return new window.DOMParser().parseFromString(html, "text/html") as unknown as Document;
}

// "KSh 12,499" -> 12499, "KES 1,999.00" -> 1999, "Ksh. 850" -> 850. Anything else -> null.
export function parsePrice(text: string | null | undefined): number | null {
  if (!text) return null;
  const match = /(?:KES|KSh\.?|Ksh\.?)\s*([\d,]+(?:\.\d{1,2})?)/i.exec(text);
  if (!match) return null;
  const value = Number(match[1].replaceAll(",", ""));
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

// Tidies text from HTML: collapses runs of spaces and newlines into one space.
function clean(text: string | null | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

export function parseListing(html: string, pageUrl: string): Product[] {
  const document = parseHtml(html);
  const products: Product[] = [];
  for (const card of document.querySelectorAll(SELECTORS.card)) {
    const sku = card.getAttribute("data-sku");
    const name = clean(card.querySelector(SELECTORS.name)?.textContent);
    const price = parsePrice(card.querySelector(SELECTORS.price)?.textContent);
    const href = card.querySelector(SELECTORS.link)?.getAttribute("href");
    if (!sku || !name || price === null || !href) continue; // skip a broken card rather than invent data
    products.push({
      sku,
      name,
      priceKes: price,
      wasKes: parsePrice(card.querySelector(SELECTORS.was)?.textContent),
      inStock: card.querySelector(SELECTORS.soldOut) === null,
      url: new URL(href, pageUrl).toString(),
    });
  }
  return products;
}

// The selectors a product page must have. If any match nothing, the shop has changed its HTML
// and the scraper needs fixing: better to stop loudly than record wrong prices quietly.
export function missingSelectors(html: string): string[] {
  const document = parseHtml(html);
  const cards = document.querySelectorAll(SELECTORS.card);
  if (cards.length === 0) return [SELECTORS.card];
  const required = [SELECTORS.name, SELECTORS.price, SELECTORS.link] as const;
  return required.filter((selector) => cards[0].querySelector(selector) === null);
}
