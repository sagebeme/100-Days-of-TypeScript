"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatKes } from "../../../lib/format.ts";

interface BuyFormProps {
  eventId: number;
  priceKes: number;
  available: number;
  signedIn: boolean;
}

// Buying: a client component, because it reacts to typing and clicking. It posts to the same API a
// phone app would (/api/events/1/orders), and the session cookie goes along by itself.
export function BuyForm({ eventId, priceKes, available, signedIn }: BuyFormProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const loginHref = `/login?next=/events/${eventId}`;

  if (!signedIn) {
    return (
      <div className="buy-form">
        <p>Log in to buy tickets. It takes a minute, and your tickets stay on your account.</p>
        <Link className="button button-primary button-block" href={loginHref}>
          Log in to buy
        </Link>
      </div>
    );
  }

  const most = Math.min(10, available);
  const buy = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/events/${eventId}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity, phone }),
      });
      const body = (await response.json().catch(() => ({}))) as { order?: { id: number }; error?: string };
      if (response.status === 201 && body.order) return router.push(`/orders/${body.order.id}`); // stays "busy" while the page changes
      if (response.status === 401) return router.push(loginHref); // the session ran out
      setError(body.error ?? "Something went wrong. No money was taken.");
    } catch {
      setError("You seem to be offline. No money was taken. Try again.");
    }
    setBusy(false);
  };

  return (
    <form className="buy-form" onSubmit={buy}>
      <div className="field">
        <label htmlFor="quantity">Tickets</label>
        <select id="quantity" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>
          {Array.from({ length: most }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} × {formatKes(priceKes)} = {formatKes(n * priceKes)}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="phone">M-Pesa phone number</label>
        <input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="button button-primary button-block" disabled={busy}>
        {busy ? "Sending the M-Pesa prompt…" : `Pay ${formatKes(quantity * priceKes)} with M-Pesa`}
      </button>
    </form>
  );
}
