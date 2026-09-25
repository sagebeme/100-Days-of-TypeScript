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
  const s = String(value);
  if (!/^\d{14}$/.test(s)) throw new Error(`Not an M-Pesa date: ${s}`);
  const [y, mo, d, h, mi, se] = [s.slice(0, 4), s.slice(4, 6), s.slice(6, 8), s.slice(8, 10), s.slice(10, 12), s.slice(12, 14)];
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${se}+03:00`).toISOString();
}

// ResultCode 0 is paid. 1032 means the customer pressed Cancel on their phone.
// Anything else (wrong PIN, not enough money, the phone was off) is a failure, with Safaricom's reason.
export function parseCallback(body: unknown): PaymentOutcome {
  const callback = CallbackSchema.parse(body).Body.stkCallback;
  const id = callback.CheckoutRequestID;

  if (callback.ResultCode === 0) {
    const items = new Map((callback.CallbackMetadata?.Item ?? []).map((item) => [item.Name, item.Value]));
    const receipt = items.get("MpesaReceiptNumber");
    const amount = items.get("Amount");
    const phone = items.get("PhoneNumber");
    const date = items.get("TransactionDate");
    if (receipt === undefined || amount === undefined || phone === undefined || date === undefined) {
      throw new Error(`Payment ${id} succeeded but its details are missing`);
    }
    return { status: "paid", checkoutRequestId: id, receipt: String(receipt), amount: Number(amount), phone: String(phone), paidAt: mpesaDateToIso(date) };
  }
  if (callback.ResultCode === 1032) {
    return { status: "cancelled", checkoutRequestId: id, reason: "You cancelled the payment on your phone." };
  }
  return { status: "failed", checkoutRequestId: id, reason: callback.ResultDesc };
}
