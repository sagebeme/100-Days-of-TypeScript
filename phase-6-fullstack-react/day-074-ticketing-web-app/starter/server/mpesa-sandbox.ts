// Already written: the bodies Safaricom really sends (Day 52), for the sandbox and the tests.
let receipts = 0;

export function mpesaCallback(checkoutRequestId: string, amount: number, outcome: "paid" | "cancelled" | "failed" = "paid") {
  const base = { MerchantRequestID: "29115-34620561-1", CheckoutRequestID: checkoutRequestId };
  if (outcome === "cancelled") return { Body: { stkCallback: { ...base, ResultCode: 1032, ResultDesc: "Request cancelled by user" } } };
  if (outcome === "failed") return { Body: { stkCallback: { ...base, ResultCode: 1, ResultDesc: "The balance is insufficient for the transaction." } } };
  receipts++;
  return {
    Body: {
      stkCallback: {
        ...base,
        ResultCode: 0,
        ResultDesc: "The service request is processed successfully.",
        CallbackMetadata: {
          Item: [
            { Name: "Amount", Value: amount },
            { Name: "MpesaReceiptNumber", Value: `TK${String(receipts).padStart(8, "0")}` },
            { Name: "Balance" },
            { Name: "TransactionDate", Value: 20261212180500 },
            { Name: "PhoneNumber", Value: 254712345678 },
          ],
        },
      },
    },
  };
}
