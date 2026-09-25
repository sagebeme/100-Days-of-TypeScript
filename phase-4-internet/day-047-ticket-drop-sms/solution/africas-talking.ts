import { z } from "zod";

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export interface SmsResult {
  number: string;
  ok: boolean;
  status: string; // "Success", "InvalidPhoneNumber", "InsufficientBalance", ...
}

export interface SmsSender {
  send(to: string[], message: string): Promise<SmsResult[]>;
}

export interface AfricasTalkingConfig {
  username: string; // "sandbox" while you practise
  apiKey: string;
  from?: string; // a sender ID or short code, if you have one
}

export const SANDBOX_URL = "https://api.sandbox.africastalking.com/version1/messaging";
export const LIVE_URL = "https://api.africastalking.com/version1/messaging";
export const BATCH_SIZE = 100; // recipients per request

const ResponseSchema = z.object({
  SMSMessageData: z.object({
    Message: z.string(),
    Recipients: z.array(
      z.object({
        number: z.string(),
        status: z.string(),
        statusCode: z.number(),
      }),
    ),
  }),
});

// 100 Processed, 101 Sent and 102 Queued all mean the message is on its way.
export const isSuccess = (statusCode: number) => statusCode >= 100 && statusCode <= 102;

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size));
  return batches;
}

export function africasTalkingSender(config: AfricasTalkingConfig, fetchFn: Fetcher): SmsSender {
  const url = config.username === "sandbox" ? SANDBOX_URL : LIVE_URL;

  async function sendBatch(to: string[], message: string): Promise<SmsResult[]> {
    const body = new URLSearchParams({ username: config.username, to: to.join(","), message });
    if (config.from) body.set("from", config.from);

    const response = await fetchFn(url, {
      method: "POST",
      headers: {
        apiKey: config.apiKey,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    if (response.status === 401) {
      throw new Error("Africa's Talking rejected the key. Check AT_USERNAME and AT_API_KEY.");
    }
    if (!response.ok) {
      throw new Error(`SMS request failed (${response.status}): ${await response.text()}`);
    }
    const data = ResponseSchema.parse(await response.json());
    return data.SMSMessageData.Recipients.map((r) => ({ number: r.number, ok: isSuccess(r.statusCode), status: r.status }));
  }

  return {
    async send(to, message) {
      const results: SmsResult[] = [];
      for (const batch of chunk(to, BATCH_SIZE)) {
        results.push(...(await sendBatch(batch, message)));
      }
      return results;
    },
  };
}

export function consoleSms(log: (line: string) => void = console.log): SmsSender {
  return {
    async send(to, message) {
      log(`SMS to ${to.length} number(s): ${message}`);
      return to.map((number) => ({ number, ok: true, status: "Printed" }));
    },
  };
}
