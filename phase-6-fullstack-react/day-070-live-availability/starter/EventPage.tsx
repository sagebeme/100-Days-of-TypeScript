import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "./ApiContext.tsx";
import { eventQuery, usePlaceOrder } from "./queries.ts";
import { ErrorPanel, SeatsLeft, UpdatedAgo } from "./pieces.tsx";
import { Poster } from "./Poster.tsx";
import { formatKes, formatWhen } from "./format.ts";
import type { Order } from "./api.ts";

// TODO: one event, and buying it. Every hook first (useQuery(eventQuery(api, id)), usePlaceOrder(id),
// useState for quantity and phone), THEN the early returns:
//   loading: <p className="loading-line">Loading the event…</p>
//   failed with nothing to show: <ErrorPanel ... />
// Then:
// <div className="event-hero event-hero-buy">
//   <Poster event={event} />
//   <div className="buy-box">
//     <p className="eyebrow">genre</p> <h1>title</h1>
//     <p className="event-hero-meta"><time dateTime>formatWhen</time><span>venue</span></p>
//     <div className="buy-status"><SeatsLeft event={event} /><UpdatedAgo ... /></div>
//     On sale (published, seats left):
//       <form className="buy-form" onSubmit={buy}>
//         a .field with <label htmlFor="quantity">Tickets</label> and a <select id="quantity">: one option per
//           number from 1 to min(10, available), labelled "2 × KES 2,500 = KES 5,000"
//         a .field with <label htmlFor="phone">M-Pesa phone number</label> <input id="phone" type="tel" autoComplete="tel" required />
//         the mutation's error, if any, as <p className="form-alert" role="alert">
//         <button type="submit" className="button button-primary button-block" disabled while pending>
//           "Sending the M-Pesa prompt…" or "Buy with M-Pesa"
//       buy: preventDefault, then placeOrder.mutate({ quantity, phone }, { onSuccess: onOrdered })
//     Otherwise: <p className="sold-out-note">"This event was cancelled." or "Sold out. Tickets sometimes come
//       back when a payment fails, so check again soon."</p>
export function EventPage({ id, onOrdered }: { id: number; onOrdered: (order: Order) => void }) {
  void [useState, useQuery, useApi, eventQuery, usePlaceOrder, ErrorPanel, SeatsLeft, UpdatedAgo, Poster, formatKes, formatWhen, onOrdered];
  void (null as unknown as FormEvent);
  return <p>TODO: EventPage for event {id}</p>;
}
