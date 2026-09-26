import { formatKes } from "./format.ts";

// TODO: <p className="price"> with <small>From</small> before the price (not for free events),
// then formatKes(priceKes).
export function PriceTag({ priceKes }: { priceKes: number }) {
  return <p>TODO: price {formatKes(priceKes)}</p>;
}
