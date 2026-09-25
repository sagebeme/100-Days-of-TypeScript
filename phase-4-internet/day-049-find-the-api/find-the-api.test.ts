import { describe, it, expect, vi, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseRobots, matches, productToken, isAllowed, crawlDelay, type Group } from "./starter/robots.ts";
import { pathPattern, findJsonEndpoints, asFetchCode } from "./starter/har.ts";
import { politeFetcher, DisallowedError, type Fetcher } from "./starter/polite.ts";

const read = (file: string) => readFileSync(join(import.meta.dirname, "starter", file), "utf8");
let robots: Group[] = [];
beforeAll(() => {
  robots = parseRobots(read("robots.txt"));
});
const har: unknown = JSON.parse(read("duka.har"));
const BOT = "FitCheckBot/1.0 (you@example.com)";

describe("parseRobots", () => {
  it("reads the groups, rules and delays", () => {
    expect(robots).toHaveLength(3);
    expect(robots[0]).toEqual({
      agents: ["*"],
      crawlDelay: 2,
      rules: [
        { allow: false, pattern: "/cart" },
        { allow: false, pattern: "/checkout" },
        { allow: false, pattern: "/account/" },
        { allow: false, pattern: "/search?" },
        { allow: false, pattern: "/*.pdf$" },
        { allow: true, pattern: "/api/products" },
        { allow: false, pattern: "/api/" },
      ],
    });
  });

  it("puts User-agent lines in a row into one group", () => {
    expect(robots[1].agents).toEqual(["pricebot", "beibot"]);
    expect(robots[1].crawlDelay).toBe(10);
  });

  it("ignores comments, blank lines, odd casing and empty Disallows", () => {
    const groups = parseRobots("Disallow: /orphan\n\nUSER-AGENT: * # everyone\ndisallow:   \nDISALLOW: /x # hidden\n");
    expect(groups).toEqual([{ agents: ["*"], crawlDelay: null, rules: [{ allow: false, pattern: "/x" }] }]);
  });

  it("copes with Windows line endings", () => {
    expect(parseRobots("User-agent: *\r\nDisallow: /a\r\n")[0].rules).toEqual([{ allow: false, pattern: "/a" }]);
  });
});

describe("matches", () => {
  it.each([
    ["/cart", "/cart", true],
    ["/cart", "/cart/items", true],
    ["/cart", "/carts", true],
    ["/cart", "/my/cart", false],
    ["/account/", "/account", false],
    ["/*.pdf$", "/files/menu.pdf", true],
    ["/*.pdf$", "/files/menu.pdf?v=2", false],
    ["/search?", "/search?q=shoes", true],
    ["/search?", "/searching", false],
    ["/*/reviews", "/products/1/reviews", true],
  ])("%s against %s: %s", (pattern, path, expected) => {
    expect(matches(pattern, path)).toBe(expected);
  });
});

describe("isAllowed", () => {
  it("finds the bot's product token", () => {
    expect(productToken("FitCheckBot/1.0 (+https://example.com)")).toBe("fitcheckbot");
    expect(productToken("  PriceBot ")).toBe("pricebot");
  });

  it("uses the * group for bots it doesn't name", () => {
    expect(isAllowed(robots, BOT, "/products/sneakers")).toBe(true);
    expect(isAllowed(robots, BOT, "/checkout/pay")).toBe(false);
    expect(isAllowed(robots, BOT, "/menus/october.pdf")).toBe(false);
  });

  it("lets the longest matching rule win", () => {
    expect(isAllowed(robots, BOT, "/api/products?page=2")).toBe(true); // Allow /api/products beats Disallow /api/
    expect(isAllowed(robots, BOT, "/api/reviews/1234")).toBe(false);
  });

  it("lets Allow win a tie", () => {
    expect(isAllowed(parseRobots("User-agent: *\nDisallow: /page\nAllow: /page"), BOT, "/page")).toBe(true);
  });

  it("uses a bot's own group instead of *", () => {
    expect(isAllowed(robots, "PriceBot/2.0", "/api/products")).toBe(false);
    expect(isAllowed(robots, "BeiBot", "/products/1234")).toBe(true);
    expect(isAllowed(robots, "BadBot/1.0", "/")).toBe(false);
  });

  it("always allows robots.txt itself, and everything when there are no rules", () => {
    expect(isAllowed(robots, "BadBot", "/robots.txt")).toBe(true);
    expect(isAllowed([], BOT, "/anything")).toBe(true);
  });
});

describe("crawlDelay", () => {
  it("reads the delay for the bot's group", () => {
    expect(crawlDelay(robots, BOT)).toBe(2);
    expect(crawlDelay(robots, "PriceBot")).toBe(10);
    expect(crawlDelay(robots, "BadBot")).toBeNull();
  });
});

describe("finding the API in a HAR file", () => {
  it("turns ids into :id", () => {
    expect(pathPattern("/api/products/1234")).toBe("/api/products/:id");
    expect(pathPattern("/api/orders/3f2b1c9e-8a7d-4e6f-9b0a-1c2d3e4f5a6b/items")).toBe("/api/orders/:id/items");
    expect(pathPattern("/api/v2/products")).toBe("/api/v2/products");
  });

  it("keeps only successful JSON requests, grouped by endpoint", () => {
    expect(findJsonEndpoints(har)).toEqual([
      {
        method: "GET",
        host: "duka.example",
        path: "/api/products",
        query: ["category", "page", "sort"],
        calls: 2,
        averageMs: 175,
        exampleUrl: "https://duka.example/api/products?category=sneakers&page=1",
      },
      {
        method: "GET",
        host: "duka.example",
        path: "/api/products/:id",
        query: [],
        calls: 2,
        averageMs: 100,
        exampleUrl: "https://duka.example/api/products/1234",
      },
      {
        method: "GET",
        host: "duka.example",
        path: "/api/reviews/:id",
        query: ["sort"],
        calls: 1,
        averageMs: 130,
        exampleUrl: "https://duka.example/api/reviews/1234?sort=new",
      },
    ]);
  });

  it("rejects a file that isn't a HAR", () => {
    expect(() => findJsonEndpoints({ requests: [] })).toThrow();
  });

  it("writes code to try an endpoint", () => {
    const [first] = findJsonEndpoints(har);
    expect(asFetchCode(first)).toContain('await fetch("https://duka.example/api/products?category=sneakers&page=1"');
  });
});

describe("politeFetcher", () => {
  function setup(minDelayMs = 1000) {
    let time = 0;
    const waits: number[] = [];
    const fetchFn = vi.fn<Fetcher>(async () => new Response("{}"));
    const polite = politeFetcher({
      robots,
      userAgent: BOT,
      minDelayMs,
      fetchFn,
      now: () => time,
      sleep: async (ms) => {
        waits.push(ms);
        time += ms;
      },
    });
    return { polite, fetchFn, waits, advance: (ms: number) => (time += ms) };
  }

  it("refuses URLs robots.txt disallows, before sending anything", async () => {
    const { polite, fetchFn } = setup();
    const attempt = polite("https://duka.example/checkout");
    await expect(attempt).rejects.toBeInstanceOf(DisallowedError);
    await expect(attempt).rejects.toThrow("robots.txt asks bots not to fetch https://duka.example/checkout");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("checks the query string too", async () => {
    const { polite } = setup();
    await expect(polite("https://duka.example/search?q=shoes")).rejects.toBeInstanceOf(DisallowedError);
  });

  it("waits the Crawl-delay between requests", async () => {
    const { polite, waits, advance } = setup(1000);
    await polite("https://duka.example/api/products?page=1");
    await polite("https://duka.example/api/products?page=2");
    advance(500);
    await polite("https://duka.example/api/products?page=3");
    expect(waits).toEqual([2000, 1500]);
  });

  it("uses your own delay when it's longer than robots.txt asks", async () => {
    const { polite, waits } = setup(5000);
    await polite("https://duka.example/products/1");
    await polite("https://duka.example/products/2");
    expect(waits).toEqual([5000]);
  });

  it("says who it is, and keeps the caller's headers", async () => {
    const { polite, fetchFn } = setup();
    await polite("https://duka.example/products/1", { headers: { Accept: "text/html" } });
    const headers = new Headers(fetchFn.mock.calls[0][1]?.headers);
    expect(headers.get("User-Agent")).toBe(BOT);
    expect(headers.get("Accept")).toBe("text/html");
  });
});
