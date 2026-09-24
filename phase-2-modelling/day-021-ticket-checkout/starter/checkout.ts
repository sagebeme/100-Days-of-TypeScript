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
  readonly eventName: string = "";

  constructor(eventName: string) {
    super("TODO: the message should be `${eventName} is sold out`");
    // TODO: set this.name to "SoldOutError"
    // TODO: set this.eventName from the argument
  }
}

export class InvalidPromoError extends Error {
  readonly code: string = "";

  constructor(code: string) {
    super("TODO: the message should be `Promo code ${code} is not valid`");
    // TODO: set this.name to "InvalidPromoError"
    // TODO: set this.code from the argument
  }
}

export type CheckoutError = SoldOutError | InvalidPromoError;

export function checkout(event: TicketEvent, quantity: number, promoCode?: string): Result<Order, CheckoutError> {
  // TODO: not enough tickets left? return { ok: false, error: new SoldOutError(event.name) }
  // TODO: if promoCode is given, look it up (ignoring case) in a Map: NAIROBI10 -> 0.1, STUDENT20 -> 0.2
  // TODO: unknown code? return { ok: false, error: new InvalidPromoError(promoCode) }
  // TODO: otherwise return { ok: true, value: { eventName, quantity, total } } with total rounded via Math.round
  throw new Error("not implemented yet");
}

export function parseQuantity(input: unknown): number {
  // TODO: accept a positive whole number, or a string holding one; narrow the unknown with typeof
  // TODO: anything else: throw new TypeError(`Invalid quantity: ${String(input)}`)
  throw new Error("not implemented yet");
}

export function describeError(error: unknown): string {
  // TODO: SoldOutError -> `Sorry, ${error.eventName} is sold out`
  // TODO: InvalidPromoError -> `The code ${error.code} is not valid`
  // TODO: any other Error -> its message
  // TODO: anything else -> "Something went wrong"
  throw new Error("not implemented yet");
}
