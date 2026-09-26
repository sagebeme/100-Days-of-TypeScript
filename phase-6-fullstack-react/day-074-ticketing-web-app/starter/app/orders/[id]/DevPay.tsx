"use client";

import { useState } from "react";

// Already written: the M-Pesa sandbox. In development nobody's phone gets a prompt, so these buttons
// send what Safaricom would. Never shown in production.
export function DevPay({ orderId, onDone }: { orderId: number; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const settle = async (outcome: "paid" | "cancelled") => {
    setBusy(true);
    await fetch(`/api/dev/orders/${orderId}/settle`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ outcome }) });
    setBusy(false);
    onDone();
  };
  return (
    <div className="sandbox" aria-label="M-Pesa sandbox" role="group">
      <p>
        <strong>Sandbox:</strong> no real phone gets a prompt. Pretend to be the fan:
      </p>
      <div className="sandbox-buttons">
        <button type="button" className="button button-primary" disabled={busy} onClick={() => settle("paid")}>
          Enter PIN and pay
        </button>
        <button type="button" className="button button-quiet" disabled={busy} onClick={() => settle("cancelled")}>
          Cancel on the phone
        </button>
      </div>
    </div>
  );
}
