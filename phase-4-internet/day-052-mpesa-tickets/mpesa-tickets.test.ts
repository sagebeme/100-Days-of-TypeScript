import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { AddressInfo } from "node:net";
import {
  createDaraja,
  darajaTimestamp,
  stkPassword,
  darajaPhone,
  BASE_URLS,
  type Daraja,
  type DarajaConfig,
  type Fetcher,
} from "./starter/daraja.ts";
import { parseCallback, mpesaDateToIso } from "./starter/callback.ts";
import { createPaymentServer } from "./starter/server.ts";
import { sampleCallback } from "./starter/simulate-callback.ts";

const config: DarajaConfig = {
  consumerKey: "key",
  consumerSecret: "secret",
  shortcode: "174379",
  passkey: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
  callbackUrl: "https://tickets.example/mpesa/callback/s3cret",
  environment: "sandbox",
};
const NOW = new Date("2026-10-03T16:45:12Z"); // 19:45:12 in Nairobi

// A fake Daraja: a token endpoint and an STK endpoint, like the real sandbox.
function fakeDaraja(stkReply: { status: number; body: unknown } = { status: 200, body: stkOk() }) {
  return vi.fn<Fetcher>(async (url) => {
    if (url.includes("/oauth/v1/generate")) {
      return new Response(JSON.stringify({ access_token: "tok_123", expires_in: "3599" }));
    }
    return new Response(JSON.stringify(stkReply.body), { status: stkReply.status });
  });
}

function stkOk() {
  return {
    MerchantRequestID: "29115-34620561-1",
    CheckoutRequestID: "ws_CO_031020261945121234",
    ResponseCode: "0",
    ResponseDescription: "Success. Request accepted for processing",
    CustomerMessage: "Success. Request accepted for processing",
  };
}

const push = { phone: "0712 345 678", amount: 2000, reference: "TIX1A2B3C4D", description: "Event tickets" };

describe("Daraja's little formats", () => {
  it("writes the timestamp in Nairobi time", () => {
    expect(darajaTimestamp(NOW)).toBe("20261003194512");
  });

  it("builds the STK password", () => {
    expect(stkPassword("174379", "abc", "20261003194512")).toBe(Buffer.from("174379abc20261003194512").toString("base64"));
  });

  it.each([
    ["0712 345 678", "254712345678"],
    ["+254 110 123 456", "254110123456"],
    ["254712345678", "254712345678"],
    ["0712-345-678", "254712345678"],
    ["0812345678", null],
    ["12345", null],
  ])("turns %j into %j", (input, expected) => {
    expect(darajaPhone(input)).toBe(expected);
  });
});

describe("createDaraja", () => {
  it("gets a token with Basic auth, and reuses it until it's nearly expired", async () => {
    let now = NOW;
    const fetchFn = fakeDaraja();
    const daraja = createDaraja(config, fetchFn, () => now);
    expect(await daraja.token()).toBe("tok_123");
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`${BASE_URLS.sandbox}/oauth/v1/generate?grant_type=client_credentials`);
    expect(new Headers(init?.headers).get("Authorization")).toBe(`Basic ${Buffer.from("key:secret").toString("base64")}`);

    now = new Date(NOW.getTime() + 3500 * 1000);
    await daraja.token();
    expect(fetchFn).toHaveBeenCalledTimes(1);
    now = new Date(NOW.getTime() + 3560 * 1000);
    await daraja.token();
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("sends the STK push the way Daraja expects", async () => {
    const fetchFn = fakeDaraja();
    const started = await createDaraja(config, fetchFn, () => NOW).stkPush(push);
    expect(started).toEqual({
      merchantRequestId: "29115-34620561-1",
      checkoutRequestId: "ws_CO_031020261945121234",
      customerMessage: "Success. Request accepted for processing",
    });

    const [url, init] = fetchFn.mock.calls[1];
    expect(url).toBe(`${BASE_URLS.sandbox}/mpesa/stkpush/v1/processrequest`);
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer tok_123");
    expect(JSON.parse(String(init?.body))).toEqual({
      BusinessShortCode: 174379,
      Password: stkPassword(config.shortcode, config.passkey, "20261003194512"),
      Timestamp: "20261003194512",
      TransactionType: "CustomerPayBillOnline",
      Amount: 2000,
      PartyA: 254712345678,
      PartyB: 174379,
      PhoneNumber: 254712345678,
      CallBackURL: "https://tickets.example/mpesa/callback/s3cret",
      AccountReference: "TIX1A2B3C4D",
      TransactionDesc: "Event tickets",
    });
  });

  it("uses the live API in production", async () => {
    const fetchFn = fakeDaraja();
    await createDaraja({ ...config, environment: "production" }, fetchFn, () => NOW).token();
    expect(fetchFn.mock.calls[0][0]).toContain(BASE_URLS.production);
  });

  it.each([
    [{ ...push, phone: "12345" }, "Enter a Safaricom number like 0712 345 678"],
    [{ ...push, amount: 0 }, "Amount must be a whole number of shillings"],
    [{ ...push, amount: 99.5 }, "Amount must be a whole number of shillings"],
    [{ ...push, reference: "THIS-IS-TOO-LONG" }, "Reference can be at most 12 characters"],
    [{ ...push, description: "Tickets for the whole squad" }, "Description can be at most 13 characters"],
  ])("checks the request before sending it: %j", async (request, message) => {
    const fetchFn = fakeDaraja();
    await expect(createDaraja(config, fetchFn, () => NOW).stkPush(request)).rejects.toThrow(message);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("passes on Daraja's error code and message", async () => {
    const fetchFn = fakeDaraja({
      status: 400,
      body: { requestId: "1", errorCode: "400.002.02", errorMessage: "Bad Request - Invalid PhoneNumber" },
    });
    await expect(createDaraja(config, fetchFn, () => NOW).stkPush(push)).rejects.toThrow(
      "Starting the M-Pesa payment failed (400.002.02: Bad Request - Invalid PhoneNumber)",
    );
  });

  it("treats a non-zero ResponseCode as a failure", async () => {
    const fetchFn = fakeDaraja({ status: 200, body: { ...stkOk(), ResponseCode: "1", ResponseDescription: "Busy" } });
    await expect(createDaraja(config, fetchFn, () => NOW).stkPush(push)).rejects.toThrow("(Busy)");
  });
});

describe("parseCallback", () => {
  it("reads a successful payment", () => {
    expect(parseCallback(sampleCallback("ws_CO_1", "paid", 2000))).toEqual({
      status: "paid",
      checkoutRequestId: "ws_CO_1",
      receipt: "TJ3SK8QX2P",
      amount: 2000,
      phone: "254712345678",
      paidAt: "2026-10-03T16:45:12.000Z",
    });
  });

  it("knows a cancel from a failure", () => {
    expect(parseCallback(sampleCallback("ws_CO_1", "cancelled"))).toEqual({
      status: "cancelled",
      checkoutRequestId: "ws_CO_1",
      reason: "You cancelled the payment on your phone.",
    });
    expect(parseCallback(sampleCallback("ws_CO_1", "wrong-pin"))).toEqual({
      status: "failed",
      checkoutRequestId: "ws_CO_1",
      reason: "The initiator information is invalid.",
    });
  });

  it("rejects a body that isn't a Daraja callback", () => {
    expect(() => parseCallback({ hello: "world" })).toThrow();
  });

  it("won't call a payment paid without its details", () => {
    const body = {
      Body: {
        stkCallback: {
          MerchantRequestID: "m",
          CheckoutRequestID: "ws_CO_1",
          ResultCode: 0,
          ResultDesc: "The service request is processed successfully.",
          CallbackMetadata: { Item: [{ Name: "Amount", Value: 2000 }] },
        },
      },
    };
    expect(() => parseCallback(body)).toThrow("Payment ws_CO_1 succeeded but its details are missing");
  });

  it("converts M-Pesa's dates", () => {
    expect(mpesaDateToIso(20261231235959)).toBe("2026-12-31T20:59:59.000Z");
    expect(() => mpesaDateToIso("yesterday")).toThrow("Not an M-Pesa date: yesterday");
  });
});

describe("the payment server", () => {
  let base: string;
  let close: () => void;
  let pushes: string[];

  beforeEach(async () => {
    pushes = [];
    let n = 0;
    const daraja: Daraja = {
      token: async () => "tok",
      stkPush: async (request) => {
        pushes.push(`${request.phone}:${request.amount}:${request.reference}`);
        return { merchantRequestId: "m", checkoutRequestId: `ws_CO_TEST_${++n}`, customerMessage: "Check your phone" };
      },
    };
    const { server } = createPaymentServer({
      daraja,
      events: [{ id: "gengetone-night", title: "Gengetone Night", priceKes: 1000 }],
      callbackSecret: "s3cret",
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    close = () => server.close();
  });

  afterEach(() => close());

  const post = (path: string, body: unknown) =>
    fetch(`${base}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const order = async (id: string) => (await fetch(`${base}/orders/${id}`)).json();

  async function buyTwo(): Promise<string> {
    const response = await post("/events/gengetone-night/tickets", { phone: "0712345678", quantity: 2 });
    expect(response.status).toBe(202);
    const body = await response.json();
    expect(body).toMatchObject({ status: "pending", message: "Check your phone" });
    return body.orderId;
  }

  it("starts a payment for the right total", async () => {
    const id = await buyTwo();
    expect(pushes).toHaveLength(1);
    expect(pushes[0]).toMatch(/^0712345678:2000:TIX[0-9A-F]{8}$/);
    expect(await order(id)).toMatchObject({ status: "pending", totalKes: 2000, quantity: 2 });
  });

  it("marks the order paid when Safaricom says so", async () => {
    const id = await buyTwo();
    const reply = await post("/mpesa/callback/s3cret", sampleCallback("ws_CO_TEST_1", "paid", 2000));
    expect(await reply.json()).toEqual({ ResultCode: 0, ResultDesc: "Accepted" });
    expect(await order(id)).toMatchObject({
      status: "paid",
      receipt: "TJ3SK8QX2P",
      note: "Paid. M-Pesa receipt TJ3SK8QX2P. Enjoy the show!",
    });
  });

  it("records a cancel", async () => {
    const id = await buyTwo();
    await post("/mpesa/callback/s3cret", sampleCallback("ws_CO_TEST_1", "cancelled"));
    expect(await order(id)).toMatchObject({ status: "cancelled", note: "You cancelled the payment on your phone." });
  });

  it("lets the first callback decide, whatever comes after", async () => {
    const id = await buyTwo();
    await post("/mpesa/callback/s3cret", sampleCallback("ws_CO_TEST_1", "paid", 2000));
    await post("/mpesa/callback/s3cret", sampleCallback("ws_CO_TEST_1", "cancelled"));
    expect((await order(id)).status).toBe("paid");
  });

  it("flags a payment for the wrong amount", async () => {
    const id = await buyTwo();
    await post("/mpesa/callback/s3cret", sampleCallback("ws_CO_TEST_1", "paid", 1));
    expect(await order(id)).toMatchObject({ status: "failed", receipt: null });
    expect((await order(id)).note).toContain("expected KES 2000");
  });

  it("ignores callbacks for payments it never started", async () => {
    const reply = await post("/mpesa/callback/s3cret", sampleCallback("ws_CO_SOMEONE_ELSE", "paid", 2000));
    expect(reply.status).toBe(200);
  });

  it("only listens for callbacks on the secret path", async () => {
    const id = await buyTwo();
    const reply = await post("/mpesa/callback/guess", sampleCallback("ws_CO_TEST_1", "paid", 2000));
    expect(reply.status).toBe(404);
    expect((await order(id)).status).toBe("pending");
  });

  it("accepts (and ignores) a callback it can't read, so Safaricom stops retrying", async () => {
    const reply = await post("/mpesa/callback/s3cret", { nonsense: true });
    expect(await reply.json()).toEqual({ ResultCode: 0, ResultDesc: "Accepted" });
  });

  it("rejects bad orders", async () => {
    expect((await post("/events/gengetone-night/tickets", { phone: "0712345678", quantity: 0 })).status).toBe(400);
    expect((await post("/events/gengetone-night/tickets", { quantity: 2 })).status).toBe(400);
    expect((await post("/events/nope/tickets", { phone: "0712345678", quantity: 1 })).status).toBe(404);
    expect((await fetch(`${base}/orders/nope`)).status).toBe(404);
  });

  it("never shows the checkout id to the public", async () => {
    const id = await buyTwo();
    expect(await order(id)).not.toHaveProperty("checkoutRequestId");
  });
});
