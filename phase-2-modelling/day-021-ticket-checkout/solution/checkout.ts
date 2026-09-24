export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export interface TicketEvent {
  name: string;
  priceKes: number;
  remaining: number;
}

export interface Order {
  eventName: string;
  quantity: number;
  total: number;
}

export class SoldOutError extends Error {
  readonly eventName: string;

  constructor(eventName: string) {
    super(`${eventName} is sold out`);
    this.name = "SoldOutError";
    this.eventName = eventName;
  }
}

export class InvalidPromoError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(`Promo code ${code} is not valid`);
    this.name = "InvalidPromoError";
    this.code = code;
  }
}

export type CheckoutError = SoldOutError | InvalidPromoError;

const PROMOS = new Map<string, number>([
  ["NAIROBI10", 0.1],
  ["STUDENT20", 0.2],
]);

export function checkout(event: TicketEvent, quantity: number, promoCode?: string): Result<Order, CheckoutError> {
  if (quantity > event.remaining) {
    return { ok: false, error: new SoldOutError(event.name) };
  }

  let discount = 0;
  if (promoCode !== undefined) {
    const found = PROMOS.get(promoCode.toUpperCase());
    if (found === undefined) {
      return { ok: false, error: new InvalidPromoError(promoCode) };
    }
    discount = found;
  }

  const total = Math.round(event.priceKes * quantity * (1 - discount));
  return { ok: true, value: { eventName: event.name, quantity, total } };
}

export function parseQuantity(input: unknown): number {
  let quantity: number | undefined;
  if (typeof input === "number") {
    quantity = input;
  } else if (typeof input === "string") {
    quantity = Number(input);
  }

  if (quantity === undefined || !Number.isInteger(quantity) || quantity <= 0) {
    throw new TypeError(`Invalid quantity: ${String(input)}`);
  }
  return quantity;
}

export function describeError(error: unknown): string {
  if (error instanceof SoldOutError) {
    return `Sorry, ${error.eventName} is sold out`;
  }
  if (error instanceof InvalidPromoError) {
    return `The code ${error.code} is not valid`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong";
}
