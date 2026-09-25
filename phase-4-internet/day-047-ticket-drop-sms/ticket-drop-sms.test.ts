import { describe, it, expect, vi } from "vitest";
import { smsInfo, toGsmFriendly } from "./starter/sms-text.ts";
import { newDrops, dropMessage, type Drop } from "./starter/drops.ts";
import {
  africasTalkingSender,
  isSuccess,
  chunk,
  consoleSms,
  SANDBOX_URL,
  LIVE_URL,
  BATCH_SIZE,
  type SmsSender,
} from "./starter/africas-talking.ts";
import { subscribersFrom } from "./starter/subscribers.ts";
import { alertNewDrops } from "./starter/alerts.ts";

const drop = (overrides: Partial<Drop> = {}): Drop => ({
  id: "sauti-sol-kicc",
  event: "Sauti Sol Reunion Tour",
  venue: "KICC",
  date: "2026-11-14",
  priceKes: 3500,
  url: "https://tix.example/ss26",
  ...overrides,
});

// What Africa's Talking sends back, trimmed.
function atReply(numbers: string[], statusCode = 101, status = "Success") {
  return {
    SMSMessageData: {
      Message: `Sent to ${numbers.length}/${numbers.length} Total Cost: KES 0.8000`,
      Recipients: numbers.map((number) => ({ number, status, statusCode, cost: "KES 0.8000", messageId: "ATXid_1" })),
    },
  };
}

describe("smsInfo", () => {
  it("fits 160 plain characters in one SMS", () => {
    expect(smsInfo("a".repeat(160))).toEqual({ encoding: "GSM-7", length: 160, parts: 1 });
    expect(smsInfo("a".repeat(161))).toEqual({ encoding: "GSM-7", length: 161, parts: 2 });
    expect(smsInfo("a".repeat(307))).toEqual({ encoding: "GSM-7", length: 307, parts: 3 });
  });

  it("counts the extended characters twice", () => {
    expect(smsInfo("€[]")).toEqual({ encoding: "GSM-7", length: 6, parts: 1 });
    expect(smsInfo("€".repeat(81)).parts).toBe(2);
  });

  it("switches the whole message to UCS-2 for one emoji or curly quote", () => {
    expect(smsInfo("Hi 👋")).toEqual({ encoding: "UCS-2", length: 5, parts: 1 });
    expect(smsInfo(`${"a".repeat(70)}’`)).toEqual({ encoding: "UCS-2", length: 71, parts: 2 });
    expect(smsInfo("…".repeat(135)).parts).toBe(3);
  });

  it("knows which accented letters are in GSM-7, and which aren't", () => {
    expect(smsInfo("Café à Zürich, Ñoño").encoding).toBe("GSM-7");
    expect(smsInfo("Bogotá").encoding).toBe("UCS-2"); // á isn't in GSM-7, only à is
  });
});

describe("toGsmFriendly", () => {
  it("swaps the usual troublemakers for plain versions", () => {
    expect(toGsmFriendly("It’s “live” – don’t miss it… • now !")).toBe(`It's "live" - don't miss it... - now !`);
  });

  it("makes a pasted message fit GSM-7", () => {
    expect(smsInfo(toGsmFriendly("Blankets & Wine – the year’s best…")).encoding).toBe("GSM-7");
  });
});

describe("dropMessage", () => {
  it("fits everything in one plain SMS", () => {
    const message = dropMessage(drop());
    expect(message).toBe(
      "TICKETS OUT: Sauti Sol Reunion Tour @ KICC, Sat 14 Nov. From KES 3,500. https://tix.example/ss26 Reply STOP to opt out",
    );
    expect(smsInfo(message)).toMatchObject({ encoding: "GSM-7", parts: 1 });
  });

  it("cleans fancy characters out of the event name", () => {
    expect(dropMessage(drop({ event: "Wine – “Live”" }))).toContain('TICKETS OUT: Wine - "Live" @');
  });

  it("shortens a long name a word at a time, keeping the price, link and opt-out", () => {
    const long = drop({
      event: "Blankets & Wine – December Edition, with the year’s best line-up",
      venue: "Laureate Gardens",
      date: "2026-12-06",
      priceKes: 4000,
      url: "https://tix.example/bw1206",
    });
    const message = dropMessage(long);
    expect(message).toBe(
      "TICKETS OUT: Blankets & Wine - December Edition, with the... @ Laureate Gardens, Sun 6 Dec. From KES 4,000. https://tix.example/bw1206 Reply STOP to opt out",
    );
    expect(smsInfo(message).parts).toBe(1);
  });

  it("gives up rather than send two parts", () => {
    expect(() => dropMessage(drop({ venue: "x".repeat(140) }))).toThrow("Can't fit drop sauti-sol-kicc into one SMS");
  });
});

describe("newDrops", () => {
  it("only returns drops nobody has heard about", () => {
    const drops = [drop(), drop({ id: "b" }), drop({ id: "c" })];
    expect(newDrops(drops, new Set(["sauti-sol-kicc", "c"])).map((d) => d.id)).toEqual(["b"]);
  });
});

describe("subscribersFrom", () => {
  it("cleans numbers, drops duplicates and respects STOP", () => {
    const list = subscribersFrom(["0712 345 678", "+254 733 111 222", "0712345678", "12345", "0722 000 111"], ["0722000111"]);
    expect(list).toEqual({ numbers: ["+254712345678", "+254733111222"], invalid: ["12345"] });
  });
});

describe("africasTalkingSender", () => {
  it("posts a form to the sandbox with the key in a header", async () => {
    const fetchFn = vi.fn(async () => new Response(JSON.stringify(atReply(["+254712345678", "+254733111222"]))));
    const sender = africasTalkingSender({ username: "sandbox", apiKey: "atsk_test" }, fetchFn);
    const results = await sender.send(["+254712345678", "+254733111222"], "Hello");

    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(SANDBOX_URL);
    expect(init.method).toBe("POST");
    const headers = new Headers(init.headers);
    expect(headers.get("apiKey")).toBe("atsk_test");
    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.get("Content-Type")).toBe("application/x-www-form-urlencoded");
    const form = new URLSearchParams(String(init.body));
    expect(form.get("username")).toBe("sandbox");
    expect(form.get("to")).toBe("+254712345678,+254733111222");
    expect(form.get("message")).toBe("Hello");
    expect(form.has("from")).toBe(false);
    expect(results).toEqual([
      { number: "+254712345678", ok: true, status: "Success" },
      { number: "+254733111222", ok: true, status: "Success" },
    ]);
  });

  it("uses the live API and a sender ID for a real account", async () => {
    const fetchFn = vi.fn(async () => new Response(JSON.stringify(atReply(["+254712345678"]))));
    await africasTalkingSender({ username: "tixke", apiKey: "k", from: "TIXKE" }, fetchFn).send(["+254712345678"], "Hi");
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(LIVE_URL);
    expect(new URLSearchParams(String(init.body)).get("from")).toBe("TIXKE");
  });

  it("reports numbers that failed", async () => {
    const fetchFn = vi.fn(async () => new Response(JSON.stringify(atReply(["+254712345678"], 403, "InvalidPhoneNumber"))));
    const results = await africasTalkingSender({ username: "sandbox", apiKey: "k" }, fetchFn).send(["+254712345678"], "Hi");
    expect(results).toEqual([{ number: "+254712345678", ok: false, status: "InvalidPhoneNumber" }]);
  });

  it("sends big lists in batches", async () => {
    const numbers = Array.from({ length: 250 }, (_, i) => `+2547${String(i).padStart(8, "0")}`);
    const fetchFn = vi.fn(async (_url: string, init?: RequestInit) => {
      const to = new URLSearchParams(String(init?.body)).get("to")!.split(",");
      return new Response(JSON.stringify(atReply(to)));
    });
    const results = await africasTalkingSender({ username: "sandbox", apiKey: "k" }, fetchFn).send(numbers, "Hi");
    expect(fetchFn).toHaveBeenCalledTimes(Math.ceil(250 / BATCH_SIZE));
    expect(results).toHaveLength(250);
  });

  it("explains a rejected key and other failures", async () => {
    const reply = (status: number, body: string) => vi.fn(async () => new Response(body, { status }));
    await expect(
      africasTalkingSender({ username: "sandbox", apiKey: "bad" }, reply(401, "The supplied authentication is invalid")).send(["+254712345678"], "Hi"),
    ).rejects.toThrow("Africa's Talking rejected the key. Check AT_USERNAME and AT_API_KEY.");
    await expect(
      africasTalkingSender({ username: "sandbox", apiKey: "k" }, reply(500, "busy")).send(["+254712345678"], "Hi"),
    ).rejects.toThrow("SMS request failed (500): busy");
  });

  it("knows which status codes mean success", () => {
    expect([100, 101, 102].every(isSuccess)).toBe(true);
    expect([401, 403, 405, 500].some(isSuccess)).toBe(false);
  });

  it("chunks lists", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 2)).toEqual([]);
  });
});

describe("alertNewDrops", () => {
  const recorder = () => {
    const sent: { to: string[]; message: string }[] = [];
    const sender: SmsSender = {
      send: async (to, message) => {
        sent.push({ to, message });
        return to.map((number) => ({ number, ok: number !== "+254799999999", status: number === "+254799999999" ? "UserInBlacklist" : "Success" }));
      },
    };
    return { sent, sender };
  };

  it("texts everyone about each new drop and reports the results", async () => {
    const { sent, sender } = recorder();
    const result = await alertNewDrops([drop(), drop({ id: "old" })], new Set(["old"]), ["+254712345678", "+254799999999"], sender);
    expect(sent).toEqual([{ to: ["+254712345678", "+254799999999"], message: dropMessage(drop()) }]);
    expect(result).toEqual({
      reports: [{ drop: "sauti-sol-kicc", sent: 1, failed: [{ number: "+254799999999", status: "UserInBlacklist" }] }],
      announced: ["sauti-sol-kicc"],
    });
  });

  it("does nothing without subscribers, so no drop gets lost", async () => {
    const { sent, sender } = recorder();
    expect(await alertNewDrops([drop()], new Set(), [], sender)).toEqual({ reports: [], announced: [] });
    expect(sent).toEqual([]);
  });

  it("works with the console sender", async () => {
    const lines: string[] = [];
    await alertNewDrops([drop()], new Set(), ["+254712345678"], consoleSms((line) => lines.push(line)));
    expect(lines).toEqual([`SMS to 1 number(s): ${dropMessage(drop())}`]);
  });
});
