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
  // TODO: YYYYMMDDHHmmss in Nairobi time (UTC+3). Tip: add 3 hours, then use toISOString() and remove - : T
  throw new Error("not implemented yet");
}

// The STK push password: base64 of shortcode + passkey + timestamp.
export function stkPassword(shortcode: string, passkey: string, timestamp: string): string {
  // TODO: Buffer.from(...).toString("base64")
  throw new Error("not implemented yet");
}

// Daraja wants 2547XXXXXXXX: no plus sign.
export function darajaPhone(phone: string): string | null {
  // TODO: accept 07.. / 01.., 254.. and +254.. (spaces and dashes allowed); return "254" + 9 digits, or null
  throw new Error("not implemented yet");
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
  // TODO: token(): GET `${base}/oauth/v1/generate?grant_type=client_credentials` with
  //   Authorization: Basic base64("consumerKey:consumerSecret"). Parse with TokenSchema.
  //   Cache it, and reuse it until a minute before expires_in runs out. On failure throw
  //   darajaError(response, "Getting a Daraja token").
  // TODO: stkPush(request): check the input first:
  //   bad phone -> "Enter a Safaricom number like 0712 345 678"
  //   amount not a whole number of at least 1 -> "Amount must be a whole number of shillings"
  //   reference over 12 characters -> "Reference can be at most 12 characters"
  //   description over 13 characters -> "Description can be at most 13 characters"
  // TODO: then POST `${base}/mpesa/stkpush/v1/processrequest` with a Bearer token and the JSON body in the
  //   README (numbers for BusinessShortCode, Amount, PartyA, PartyB and PhoneNumber).
  //   Not ok -> darajaError(response, "Starting the M-Pesa payment"). ResponseCode other than "0" ->
  //   "Starting the M-Pesa payment failed (<ResponseDescription>)". Return the three ids/messages.
  throw new Error("not implemented yet");
}
