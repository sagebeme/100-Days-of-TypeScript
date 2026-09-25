// Already written: pretend to be Safaricom and send the payment result to your server.
//   node phase-4-internet/day-052-mpesa-tickets/starter/simulate-callback.ts ws_CO_DEMO_1 paid
//   node phase-4-internet/day-052-mpesa-tickets/starter/simulate-callback.ts ws_CO_DEMO_1 cancelled
//   node phase-4-internet/day-052-mpesa-tickets/starter/simulate-callback.ts ws_CO_DEMO_1 paid 1   (pays the wrong amount)
// The bodies are the shape Daraja really sends.

export function sampleCallback(checkoutRequestId: string, outcome: "paid" | "cancelled" | "wrong-pin", amount = 2000) {
  const base = { MerchantRequestID: "29115-34620561-1", CheckoutRequestID: checkoutRequestId };
  if (outcome === "cancelled") {
    return { Body: { stkCallback: { ...base, ResultCode: 1032, ResultDesc: "Request cancelled by user" } } };
  }
  if (outcome === "wrong-pin") {
    return { Body: { stkCallback: { ...base, ResultCode: 2001, ResultDesc: "The initiator information is invalid." } } };
  }
  return {
    Body: {
      stkCallback: {
        ...base,
        ResultCode: 0,
        ResultDesc: "The service request is processed successfully.",
        CallbackMetadata: {
          Item: [
            { Name: "Amount", Value: amount },
            { Name: "MpesaReceiptNumber", Value: "TJ3SK8QX2P" },
            { Name: "Balance" },
            { Name: "TransactionDate", Value: 20261003194512 },
            { Name: "PhoneNumber", Value: 254712345678 },
          ],
        },
      },
    },
  };
}

if (import.meta.main) {
  const [id, outcome = "paid", amount] = process.argv.slice(2);
  if (!id) {
    console.error("Give the CheckoutRequestID your server printed, like ws_CO_DEMO_1");
    process.exit(1);
  }
  const secret = process.env.CALLBACK_SECRET ?? "demo-secret";
  const response = await fetch(`http://localhost:3052/mpesa/callback/${secret}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sampleCallback(id, outcome as "paid" | "cancelled" | "wrong-pin", amount ? Number(amount) : undefined)),
  });
  console.log(response.status, await response.text());
}
