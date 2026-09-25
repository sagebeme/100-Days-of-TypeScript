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
  // TODO: find "KES", "KSh" or "Ksh" (any case, maybe with a dot) followed by a number with commas
  //   and maybe 1 or 2 decimals. Remove the commas, round to whole shillings.
  //   No match, or not above 0 -> null
  throw new Error("not implemented yet");
}

// Tidies text from HTML: collapses runs of spaces and newlines into one space.
function clean(text: string | null | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

export function parseListing(html: string, pageUrl: string): Product[] {
  // TODO: parseHtml, then for every SELECTORS.card element read:
  //   sku from its data-sku attribute; name (clean()ed text of SELECTORS.name);
  //   price and was (parsePrice of SELECTORS.price / SELECTORS.was); inStock (no SELECTORS.soldOut);
  //   url: SELECTORS.link's href made absolute with new URL(href, pageUrl)
  // TODO: skip any card missing a sku, a name, a price or a link
  throw new Error("not implemented yet");
}

// The selectors a product page must have. If any match nothing, the shop has changed its HTML
// and the scraper needs fixing: better to stop loudly than record wrong prices quietly.
export function missingSelectors(html: string): string[] {
  // TODO: no cards at all -> [SELECTORS.card]
  // TODO: otherwise, which of SELECTORS.name, SELECTORS.price and SELECTORS.link the FIRST card doesn't have
  throw new Error("not implemented yet");
}
