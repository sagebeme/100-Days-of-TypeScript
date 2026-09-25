import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parsePrice, parseListing, missingSelectors, type Product } from "./starter/scrape.ts";
import { record, compare, formatTable, type History } from "./starter/history.ts";

const page = (name: string) => readFileSync(join(import.meta.dirname, "starter", "pages", `${name}.html`), "utf8");
const URL_ = "https://duka.example/sneakers";

const product = (overrides: Partial<Product> = {}): Product => ({
  sku: "AF1-WHT-42",
  name: "Air Classic Low – White",
  priceKes: 12499,
  wasKes: null,
  inStock: true,
  url: "https://duka.example/products/AF1-WHT-42",
  ...overrides,
});

describe("parsePrice", () => {
  it.each([
    ["KSh 12,499", 12499],
    ["KES 1,999.00", 1999],
    ["Ksh. 850", 850],
    ["  ksh 4,250.50 ", 4251],
    ["Was KSh 10,500!", 10500],
  ])("reads %j as %i", (text, value) => {
    expect(parsePrice(text)).toBe(value);
  });

  it.each([null, undefined, "", "Call for price", "12,499", "KSh 0", "$120"])("gives null for %j", (text) => {
    expect(parsePrice(text)).toBeNull();
  });
});

describe("parseListing", () => {
  it("reads every product card", () => {
    expect(parseListing(page("sneakers-yesterday"), URL_)).toEqual([
      product(),
      {
        sku: "RS-XL-BLK",
        name: "Retro Runner XL, Black",
        priceKes: 8999,
        wasKes: 10500,
        inStock: true,
        url: "https://duka.example/products/RS-XL-BLK",
      },
      {
        sku: "CNV-HI-RED",
        name: "Canvas High Top (Red)",
        priceKes: 4250,
        wasKes: null,
        inStock: true,
        url: "https://duka.example/products/CNV-HI-RED",
      },
      {
        sku: "SLD-ORG",
        name: "Slides & Socks Combo",
        priceKes: 1999,
        wasKes: null,
        inStock: false,
        url: "https://duka.example/products/SLD-ORG",
      },
    ]);
  });

  it("decodes HTML entities and tidies whitespace", () => {
    const html = `<article class="product-card" data-sku="X"><a class="product-link" href="/p/x"><h2 class="product-name">
      Tom &amp;   Jerry
    </h2></a><span class="price-now">KSh 100</span></article>`;
    expect(parseListing(html, URL_)[0].name).toBe("Tom & Jerry");
  });

  it("skips a card with no price instead of inventing one", () => {
    const html = `<article class="product-card" data-sku="X"><a class="product-link" href="/p/x"><h2 class="product-name">X</h2></a>
      <span class="price-now">Call for price</span></article>`;
    expect(parseListing(html, URL_)).toEqual([]);
  });

  it("never runs the page's scripts", () => {
    expect(() => parseListing(page("sneakers-today"), URL_)).not.toThrow();
    expect(parseListing(page("sneakers-today"), URL_)).toHaveLength(5);
  });
});

describe("missingSelectors", () => {
  it("is empty when the page looks the way the scraper expects", () => {
    expect(missingSelectors(page("sneakers-today"))).toEqual([]);
  });

  it("notices a redesign", () => {
    expect(missingSelectors(page("sneakers-redesigned"))).toEqual(["article.product-card"]);
  });

  it("names the selector that stopped matching", () => {
    const html = `<article class="product-card" data-sku="X"><a class="product-link" href="/p/x"><h2 class="product-name">X</h2></a>
      <span class="amount">KSh 100</span></article>`;
    expect(missingSelectors(html)).toEqual([".price-now"]);
  });
});

describe("record", () => {
  it("stores the first price, then only changes", () => {
    let history: History = {};
    history = record(history, [product({ priceKes: 12499 })], "2026-09-25");
    history = record(history, [product({ priceKes: 12499 })], "2026-09-26");
    history = record(history, [product({ priceKes: 10999 })], "2026-09-27");
    expect(history).toEqual({
      "AF1-WHT-42": [
        { date: "2026-09-25", priceKes: 12499 },
        { date: "2026-09-27", priceKes: 10999 },
      ],
    });
  });

  it("does not change the history it was given", () => {
    const before: History = { "AF1-WHT-42": [{ date: "2026-09-25", priceKes: 12499 }] };
    record(before, [product({ priceKes: 1 })], "2026-09-26");
    expect(before["AF1-WHT-42"]).toHaveLength(1);
  });
});

describe("compare", () => {
  const history: History = {
    "AF1-WHT-42": [
      { date: "2026-09-20", priceKes: 11999 },
      { date: "2026-09-25", priceKes: 12499 },
      { date: "2026-09-26", priceKes: 10999 },
    ],
    "CNV-HI-RED": [{ date: "2026-09-25", priceKes: 4250 }],
    "TRL-GRN": [{ date: "2026-09-26", priceKes: 7800 }],
  };

  it("spots a drop to the lowest price ever", () => {
    const [row] = compare(history, [product({ priceKes: 10999 })], "2026-09-26");
    expect(row).toMatchObject({ trend: "down", changeKes: -1500, lowestEver: true });
  });

  it("says 'same' for an unchanged price, and 'new' for a product first seen today", () => {
    const rows = compare(
      history,
      [product({ sku: "CNV-HI-RED", priceKes: 4250 }), product({ sku: "TRL-GRN", priceKes: 7800 })],
      "2026-09-26",
    );
    expect(rows.map((r) => r.trend)).toEqual(["same", "new"]);
  });

  it("compares with the last price when nothing was recorded today", () => {
    const [row] = compare(history, [product({ priceKes: 10999 })], "2026-09-30");
    expect(row).toMatchObject({ trend: "same", changeKes: 0 });
  });

  it("spots a rise", () => {
    const rise: History = { X: [{ date: "2026-09-25", priceKes: 9000 }, { date: "2026-09-26", priceKes: 9500 }] };
    expect(compare(rise, [product({ sku: "X", priceKes: 9500 })], "2026-09-26")[0]).toMatchObject({
      trend: "up",
      changeKes: 500,
      lowestEver: false,
    });
  });
});

describe("formatTable", () => {
  it("lines everything up", () => {
    const rows = [
      { product: product({ priceKes: 10999 }), trend: "down" as const, changeKes: -1500, lowestEver: true },
      { product: product({ name: "Retro Runner XL, Black", priceKes: 9499 }), trend: "up" as const, changeKes: 500, lowestEver: false },
      { product: product({ name: "Slides & Socks Combo", priceKes: 1999, inStock: false }), trend: "same" as const, changeKes: 0, lowestEver: false },
      { product: product({ name: "Trail Grip Mid, Olive", priceKes: 7800 }), trend: "new" as const, changeKes: 0, lowestEver: false },
    ];
    expect(formatTable(rows)).toBe(
      [
        "Product                       Price  Change",
        "Air Classic Low – White  KES 10,999  ▼ KES 1,500  (lowest ever)",
        "Retro Runner XL, Black    KES 9,499  ▲ KES 500",
        "Slides & Socks Combo      KES 1,999  =  (sold out)",
        "Trail Grip Mid, Olive     KES 7,800  new",
      ].join("\n"),
    );
  });
});
