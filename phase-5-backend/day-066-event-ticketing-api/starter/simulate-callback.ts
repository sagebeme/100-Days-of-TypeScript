// Already written: pretend to be Safaricom, and tell the API how a payment went.
//   node phase-5-backend/day-066-event-ticketing-api/starter/simulate-callback.ts ws_CO_DEMO_1 2000 paid
//   node phase-5-backend/day-066-event-ticketing-api/starter/simulate-callback.ts ws_CO_DEMO_1 2000 cancelled
// The bodies are the shape Daraja really sends (Day 52).
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

if (import.meta.main) {
  const [id, amount, outcome = "paid"] = process.argv.slice(2);
  if (!id || !amount) {
    console.error("Give the CheckoutRequestID the server printed and the amount: ws_CO_DEMO_1 2000 paid");
    process.exit(1);
  }
  const token = process.env.CALLBACK_TOKEN ?? "demo-callback";
  const response = await fetch(`http://localhost:${process.env.PORT ?? 3066}/payments/mpesa/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mpesaCallback(id, Number(amount), outcome as "paid")),
  });
  console.log(response.status, await response.text());
}
