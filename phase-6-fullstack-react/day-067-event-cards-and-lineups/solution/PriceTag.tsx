import { formatKes } from "./format.ts";

// "From KES 2,500", or "Free" for a free event. The price is the one thing people compare
// across cards, so it gets its own component with tabular numbers.
export function PriceTag({ priceKes }: { priceKes: number }) {
  return (
    <p className="price">
      {priceKes > 0 && <small>From</small>}
      {formatKes(priceKes)}
    </p>
  );
}
