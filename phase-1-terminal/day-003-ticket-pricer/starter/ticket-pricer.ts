export type TicketType = "early-bird" | "student" | "vip";

export function priceTicket(type: TicketType, basePrice: number): number {
  // TODO: if type is "early-bird", return basePrice * 0.8
  // TODO: else if type is "student", return basePrice * 0.5
  // TODO: else (it must be "vip"), return basePrice * 1.5
  return 0;
}
