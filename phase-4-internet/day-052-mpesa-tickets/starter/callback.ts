import { z } from "zod";

// What Safaricom POSTs to your callback URL when the customer has (or hasn't) paid.
const CallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z
        .object({
          Item: z.array(z.object({ Name: z.string(), Value: z.union([z.string(), z.number()]).optional() })),
        })
        .optional(),
    }),
  }),
});

export type PaymentOutcome =
  | { status: "paid"; checkoutRequestId: string; receipt: string; amount: number; phone: string; paidAt: string }
  | { status: "cancelled" | "failed"; checkoutRequestId: string; reason: string };

// 20261003194512 (Nairobi time, as a number) -> "2026-10-03T16:45:12.000Z"
export function mpesaDateToIso(value: number | string): string {
  // TODO: 14 digits, YYYYMMDDHHmmss in Nairobi time -> an ISO string in UTC.
  //   Anything else -> throw `Not an M-Pesa date: <value>`
  throw new Error("not implemented yet");
}

export function parseCallback(body: unknown): PaymentOutcome {
  // TODO: parse with CallbackSchema (let it throw on a bad body).
  // TODO: ResultCode 0 -> "paid", with receipt, amount, phone (as a string) and paidAt from the
  //   CallbackMetadata items (MpesaReceiptNumber, Amount, PhoneNumber, TransactionDate).
  //   If any is missing, throw `Payment <id> succeeded but its details are missing`
  // TODO: 1032 -> "cancelled", reason "You cancelled the payment on your phone."
  // TODO: anything else -> "failed", with Safaricom's ResultDesc as the reason
  throw new Error("not implemented yet");
}
