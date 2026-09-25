import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { loadConfig, redact } from "./starter/config.ts";
import { createRatesClient, CACHE_MS, type Fetcher } from "./starter/rates.ts";
import { landedCost, formatCost, EXAMPLE_RULES } from "./starter/cost.ts";
import { server, VALID_KEY } from "./starter/fake-rates-server.ts";

const repoRoot = join(import.meta.dirname, "..", "..");
const config = { ratesApiKey: "test-key-1234567890", ratesApiUrl: "https://rates.test/latest" };
const ratesBody = { base: "USD", rates: { KES: 129.35, EUR: 0.92 } };

function respond(body: unknown, status = 200): Fetcher {
  return vi.fn(async () => new Response(JSON.stringify(body), { status }));
}

describe("keeping the key out of git", () => {
  it("ignores .env files", () => {
    const ignored = readFileSync(join(repoRoot, ".gitignore"), "utf8").split("\n").map((line) => line.trim());
    expect(ignored).toContain(".env");
  });

  it("commits an example file with no real key in it", () => {
    const example = readFileSync(join(import.meta.dirname, "starter", ".env.example"), "utf8");
    expect(example).toContain("RATES_API_KEY=");
    expect(example).not.toContain(VALID_KEY);
  });
});

describe("loadConfig", () => {
  it("reads the key and the URL", () => {
    expect(loadConfig({ RATES_API_KEY: "  abcdefghijkl  ", RATES_API_URL: "https://rates.test/latest" })).toEqual({
      ratesApiKey: "abcdefghijkl",
      ratesApiUrl: "https://rates.test/latest",
    });
  });

  it("uses the local fake API when no URL is set", () => {
    expect(loadConfig({ RATES_API_KEY: "abcdefghijkl" }).ratesApiUrl).toBe("http://localhost:4545/latest");
  });

  it("explains a missing key", () => {
    expect(() => loadConfig({})).toThrow(
      "Bad configuration:\n  RATES_API_KEY: RATES_API_KEY is missing. Copy .env.example to .env and put your key in it.",
    );
  });

  it("lists every problem at once", () => {
    expect(() => loadConfig({ RATES_API_KEY: "short", RATES_API_URL: "localhost" })).toThrow(
      "Bad configuration:\n  RATES_API_KEY: RATES_API_KEY looks too short to be a real key\n" +
        "  RATES_API_URL: RATES_API_URL must be a full URL, like http://localhost:4545/latest",
    );
  });
});

describe("redact", () => {
  it("shows only the last four characters", () => {
    expect(redact("dev-key-2026-practice")).toBe("****tice");
  });

  it("hides short secrets completely", () => {
    expect(redact("12345678")).toBe("****");
  });
});

describe("the rates client", () => {
  it("sends the key in a header, never in the URL", async () => {
    const fetchFn = respond(ratesBody);
    await createRatesClient(config, fetchFn).kesPerDollar();
    const [url, init] = vi.mocked(fetchFn).mock.calls[0];
    expect(url).toBe("https://rates.test/latest");
    expect(url).not.toContain(config.ratesApiKey);
    expect(new Headers(init?.headers).get("Authorization")).toBe(`Bearer ${config.ratesApiKey}`);
  });

  it("returns the shilling rate", async () => {
    await expect(createRatesClient(config, respond(ratesBody)).kesPerDollar()).resolves.toBe(129.35);
  });

  it("remembers the rate for an hour, then fetches a fresh one", async () => {
    let time = 0;
    const fetchFn = respond(ratesBody);
    const client = createRatesClient(config, fetchFn, () => time);
    await client.kesPerDollar();
    time = CACHE_MS - 1;
    await client.kesPerDollar();
    expect(fetchFn).toHaveBeenCalledTimes(1);
    time = CACHE_MS;
    await client.kesPerDollar();
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it.each([
    [401, "The rates API rejected your key. Check RATES_API_KEY in your .env file."],
    [429, "You've used up the rates API's quota. Try again later."],
    [500, "Rates request failed: 500"],
  ])("explains a %i", async (status, message) => {
    await expect(createRatesClient(config, respond({ error: "x" }, status)).kesPerDollar()).rejects.toThrow(message);
  });

  it("notices when KES is missing", async () => {
    await expect(
      createRatesClient(config, respond({ base: "USD", rates: { EUR: 0.92 } })).kesPerDollar(),
    ).rejects.toThrow("The rates API didn't include KES");
  });

  it("checks the shape of the answer", async () => {
    await expect(createRatesClient(config, respond({ rates: "none" })).kesPerDollar()).rejects.toThrow();
  });
});

describe("against the fake API over real HTTP", () => {
  let url: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => server.listen(0, resolve));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/latest`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("works with the right key", async () => {
    await expect(createRatesClient({ ratesApiKey: VALID_KEY, ratesApiUrl: url }, fetch).kesPerDollar()).resolves.toBe(129.35);
  });

  it("gets a 401 with the wrong key", async () => {
    await expect(
      createRatesClient({ ratesApiKey: "not-the-right-key", ratesApiUrl: url }, fetch).kesPerDollar(),
    ).rejects.toThrow("rejected your key");
  });
});

describe("landedCost", () => {
  it("adds every cost, in whole shillings", () => {
    const cost = landedCost({ itemUsd: 120, shippingUsd: 35 }, 129.35, EXAMPLE_RULES);
    expect(cost.lines).toEqual([
      { label: "Item", kes: 15522 },
      { label: "Shipping", kes: 4527 },
      { label: "Bank's dollar fee", kes: 601 },
      { label: "Import duty", kes: 5012 },
      { label: "IDF", kes: 501 },
      { label: "Railway levy", kes: 401 },
      { label: "VAT", kes: 4010 },
      { label: "Clearing", kes: 1000 },
    ]);
    expect(cost.totalKes).toBe(31574);
    expect(cost.stickerKes).toBe(15522);
  });

  it("uses the rules it's given", () => {
    const noTax = { ...EXAMPLE_RULES, dutyRate: 0, idfRate: 0, rdlRate: 0, vatRate: 0, cardFxRate: 0, clearingKes: 0 };
    expect(landedCost({ itemUsd: 10, shippingUsd: 0 }, 130, noTax).totalKes).toBe(1300);
  });

  it("rejects impossible orders", () => {
    expect(() => landedCost({ itemUsd: 0, shippingUsd: 5 }, 130, EXAMPLE_RULES)).toThrow(
      "The item must cost something, and shipping can't be negative",
    );
    expect(() => landedCost({ itemUsd: 10, shippingUsd: -1 }, 130, EXAMPLE_RULES)).toThrow();
  });
});

describe("formatCost", () => {
  it("prints a table and the surprise", () => {
    expect(formatCost(landedCost({ itemUsd: 120, shippingUsd: 35 }, 129.35, EXAMPLE_RULES))).toBe(
      [
        "Item                 KES 15,522",
        "Shipping              KES 4,527",
        "Bank's dollar fee       KES 601",
        "Import duty           KES 5,012",
        "IDF                     KES 501",
        "Railway levy            KES 401",
        "VAT                   KES 4,010",
        "Clearing              KES 1,000",
        "-------------------------------",
        "Total                KES 31,574",
        "",
        "That's 103% more than the KES 15,522 on the website.",
      ].join("\n"),
    );
  });
});
