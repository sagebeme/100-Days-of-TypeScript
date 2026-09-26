// Already written: the bodies Safaricom really sends (Day 52), for the sandbox and the tests.
import { randomBytes } from "node:crypto";

// A new receipt number every time, like the real ones: counting from 1 would repeat the first
// number each time this runs, and the API rightly refuses a receipt it has already seen.
const newReceipt = () => `TK${randomBytes(4).toString("hex").toUpperCase()}`;

export function mpesaCallback(checkoutRequestId: string, amount: number, outcome: "paid" | "cancelled" | "failed" = "paid") {
  const base = { MerchantRequestID: "29115-34620561-1", CheckoutRequestID: checkoutRequestId };
  if (outcome === "cancelled") return { Body: { stkCallback: { ...base, ResultCode: 1032, ResultDesc: "Request cancelled by user" } } };
  if (outcome === "failed") return { Body: { stkCallback: { ...base, ResultCode: 1, ResultDesc: "The balance is insufficient for the transaction." } } };
  return {
    Body: {
      stkCallback: {
        ...base,
        ResultCode: 0,
        ResultDesc: "The service request is processed successfully.",
        CallbackMetadata: {
          Item: [
            { Name: "Amount", Value: amount },
            { Name: "MpesaReceiptNumber", Value: newReceipt() },
            { Name: "Balance" },
            { Name: "TransactionDate", Value: 20261212180500 },
            { Name: "PhoneNumber", Value: 254712345678 },
          ],
        },
      },
    },
  };
}
