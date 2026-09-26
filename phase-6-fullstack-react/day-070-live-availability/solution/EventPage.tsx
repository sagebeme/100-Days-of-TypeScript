import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "./ApiContext.tsx";
import { eventQuery, usePlaceOrder } from "./queries.ts";
import { ErrorPanel, SeatsLeft, UpdatedAgo } from "./pieces.tsx";
import { Poster } from "./Poster.tsx";
import { formatKes, formatWhen } from "./format.ts";
import type { Order } from "./api.ts";

export function EventPage({ id, onOrdered }: { id: number; onOrdered: (order: Order) => void }) {
  const api = useApi();
  const { data: event, error, isPending, isFetching, dataUpdatedAt, refetch } = useQuery(eventQuery(api, id));
  const placeOrder = usePlaceOrder(id);
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState("");

  if (isPending) return <p className="loading-line">Loading the event…</p>;
  if (error && !event) return <ErrorPanel message={error.message} onRetry={() => void refetch()} />;
  const e = event!;
  const onSale = e.status === "published" && e.available > 0;
  const most = Math.min(10, e.available);

  const buy = (submit: FormEvent) => {
    submit.preventDefault();
    placeOrder.mutate({ quantity: Math.min(quantity, most), phone }, { onSuccess: onOrdered });
  };

  return (
    <div className="event-hero event-hero-buy">
      <Poster event={e} />
      <div className="buy-box">
        <p className="eyebrow">{e.genre}</p>
        <h1>{e.title}</h1>
        <p className="event-hero-meta">
          <time dateTime={e.startsAt}>{formatWhen(e.startsAt)}</time>
          <span>{e.venue}</span>
        </p>
        <div className="buy-status">
          <SeatsLeft event={e} />
          <UpdatedAgo at={dataUpdatedAt} fetching={isFetching} />
        </div>

        {onSale ? (
          <form className="buy-form" onSubmit={buy}>
            <div className="field">
              <label htmlFor="quantity">Tickets</label>
              <select id="quantity" value={Math.min(quantity, most)} onChange={(change) => setQuantity(Number(change.target.value))}>
                {Array.from({ length: most }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} × {formatKes(e.priceKes)} = {formatKes(n * e.priceKes)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="phone">M-Pesa phone number</label>
              <input id="phone" type="tel" autoComplete="tel" placeholder="0712 345 678" value={phone} onChange={(change) => setPhone(change.target.value)} required />
            </div>
            {placeOrder.isError && (
              <p className="form-alert" role="alert">
                {placeOrder.error.message}
              </p>
            )}
            <button type="submit" className="button button-primary button-block" disabled={placeOrder.isPending}>
              {placeOrder.isPending ? "Sending the M-Pesa prompt…" : "Buy with M-Pesa"}
            </button>
          </form>
        ) : (
          <p className="sold-out-note">{e.status === "cancelled" ? "This event was cancelled." : "Sold out. Tickets sometimes come back when a payment fails, so check again soon."}</p>
        )}
      </div>
    </div>
  );
}
