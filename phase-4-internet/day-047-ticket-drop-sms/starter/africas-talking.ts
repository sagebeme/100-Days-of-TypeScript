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
export function isSuccess(statusCode: number): boolean {
  // TODO: 100 (Processed), 101 (Sent) and 102 (Queued) mean the message is on its way
  throw new Error("not implemented yet");
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  // TODO: split the list into batches of `size` (the last one can be shorter)
  throw new Error("not implemented yet");
}

export function africasTalkingSender(config: AfricasTalkingConfig, fetchFn: Fetcher): SmsSender {
  // TODO: use SANDBOX_URL when the username is "sandbox", otherwise LIVE_URL
  // TODO: send(to, message): for each batch of BATCH_SIZE numbers, POST a form (URLSearchParams) with
  //   username, to (the numbers joined with commas), message, and from if there is one.
  //   Headers: apiKey, Accept: application/json, Content-Type: application/x-www-form-urlencoded
  //   401 -> "Africa's Talking rejected the key. Check AT_USERNAME and AT_API_KEY."
  //   other !ok -> `SMS request failed (<status>): <body text>`
  //   Parse the reply with ResponseSchema and turn each recipient into { number, ok, status }
  throw new Error("not implemented yet");
}

export function consoleSms(log: (line: string) => void = console.log): SmsSender {
  return {
    async send(to, message) {
      log(`SMS to ${to.length} number(s): ${message}`);
      return to.map((number) => ({ number, ok: true, status: "Printed" }));
    },
  };
}
