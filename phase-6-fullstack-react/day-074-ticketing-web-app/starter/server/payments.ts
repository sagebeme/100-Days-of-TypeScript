import type { Daraja } from "./daraja.ts";

// Already written: the app talks to "Payments", not to Daraja directly. In production that's
// Day 52's Daraja client; in tests and demos, a fake that records what it was asked to do.
export interface PaymentRequest {
  phone: string;
  amount: number;
  reference: string; // 12 characters at most: "ORDER-42"
  description: string; // 13 characters at most
}

export interface Payments {
  // Sends the "enter your M-Pesa PIN" prompt to the phone. The result arrives later, at the callback.
  start(request: PaymentRequest): Promise<{ checkoutRequestId: string }>;
}

export function darajaPayments(daraja: Daraja): Payments {
  return {
    async start(request) {
      const started = await daraja.stkPush(request);
      return { checkoutRequestId: started.checkoutRequestId };
    },
  };
}

// No Safaricom involved: every payment gets an id like ws_CO_DEMO_1. Send the result yourself
// with simulate-callback.ts.
export function demoPayments(): Payments & { started: PaymentRequest[] } {
  const started: PaymentRequest[] = [];
  return {
    started,
    async start(request) {
      started.push(request);
      return { checkoutRequestId: `ws_CO_DEMO_${started.length}` };
    },
  };
}
