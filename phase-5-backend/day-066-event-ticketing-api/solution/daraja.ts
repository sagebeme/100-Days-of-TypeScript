import { z } from "zod";

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export interface DarajaConfig {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string; // 174379 in the sandbox
  passkey: string;
  callbackUrl: string; // where Safaricom POSTs the result: must be public HTTPS
  environment: "sandbox" | "production";
}

export const BASE_URLS = {
  sandbox: "https://sandbox.safaricom.co.ke",
  production: "https://api.safaricom.co.ke",
} as const;

// Daraja wants the time as YYYYMMDDHHmmss, in Kenyan time.
export function darajaTimestamp(date: Date): string {
  const nairobi = new Date(date.getTime() + 3 * 60 * 60 * 1000); // Kenya is always UTC+3
  return nairobi.toISOString().replace(/[-:T]/g, "").slice(0, 14);
}

// The STK push password: base64 of shortcode + passkey + timestamp.
export function stkPassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

// Daraja wants 2547XXXXXXXX: no plus sign.
export function darajaPhone(phone: string): string | null {
  const digits = phone.replace(/[\s-]/g, "");
  const match = /^(?:\+?254|0)([17]\d{8})$/.exec(digits);
  return match ? `254${match[1]}` : null;
}

const TokenSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.coerce.number().positive(), // Daraja sends it as a string: "3599"
});

const StkResponseSchema = z.object({
  MerchantRequestID: z.string(),
  CheckoutRequestID: z.string(),
  ResponseCode: z.string(),
  ResponseDescription: z.string(),
  CustomerMessage: z.string(),
});

const DarajaErrorSchema = z.object({ errorCode: z.string(), errorMessage: z.string() });

export interface StkRequest {
  phone: string;
  amount: number;
  reference: string; // what the customer sees as the account: 12 characters at most
  description: string; // 13 characters at most
}

export interface StkStarted {
  merchantRequestId: string;
  checkoutRequestId: string; // the id the callback will carry
  customerMessage: string;
}

export interface Daraja {
  token(): Promise<string>;
  stkPush(request: StkRequest): Promise<StkStarted>;
}

async function darajaError(response: Response, what: string): Promise<Error> {
  const body: unknown = await response.json().catch(() => null);
  const parsed = DarajaErrorSchema.safeParse(body);
  const detail = parsed.success ? `${parsed.data.errorCode}: ${parsed.data.errorMessage}` : `status ${response.status}`;
  return new Error(`${what} failed (${detail})`);
}

export function createDaraja(config: DarajaConfig, fetchFn: Fetcher, now: () => Date = () => new Date()): Daraja {
  const base = BASE_URLS[config.environment];
  let cached: { token: string; expiresAt: number } | undefined;

  async function token(): Promise<string> {
    // Tokens last about an hour. Reuse one until a minute before it runs out.
    if (cached && now().getTime() < cached.expiresAt - 60_000) {
      return cached.token;
    }
    const basic = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString("base64");
    const response = await fetchFn(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${basic}` },
    });
    if (!response.ok) {
      throw await darajaError(response, "Getting a Daraja token");
    }
    const data = TokenSchema.parse(await response.json());
    cached = { token: data.access_token, expiresAt: now().getTime() + data.expires_in * 1000 };
    return data.access_token;
  }

  async function stkPush(request: StkRequest): Promise<StkStarted> {
    const phone = darajaPhone(request.phone);
    if (phone === null) throw new Error("Enter a Safaricom number like 0712 345 678");
    if (!Number.isInteger(request.amount) || request.amount < 1) throw new Error("Amount must be a whole number of shillings");
    if (request.reference.length > 12) throw new Error("Reference can be at most 12 characters");
    if (request.description.length > 13) throw new Error("Description can be at most 13 characters");

    const timestamp = darajaTimestamp(now());
    const response = await fetchFn(`${base}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        BusinessShortCode: Number(config.shortcode),
        Password: stkPassword(config.shortcode, config.passkey, timestamp),
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: request.amount,
        PartyA: Number(phone),
        PartyB: Number(config.shortcode),
        PhoneNumber: Number(phone),
        CallBackURL: config.callbackUrl,
        AccountReference: request.reference,
        TransactionDesc: request.description,
      }),
    });
    if (!response.ok) {
      throw await darajaError(response, "Starting the M-Pesa payment");
    }
    const data = StkResponseSchema.parse(await response.json());
    if (data.ResponseCode !== "0") {
      throw new Error(`Starting the M-Pesa payment failed (${data.ResponseDescription})`);
    }
    return {
      merchantRequestId: data.MerchantRequestID,
      checkoutRequestId: data.CheckoutRequestID,
      customerMessage: data.CustomerMessage,
    };
  }

  return { token, stkPush };
}
