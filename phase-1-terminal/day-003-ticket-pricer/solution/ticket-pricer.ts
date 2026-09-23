export type TicketType = "early-bird" | "student" | "vip";

export function priceTicket(type: TicketType, basePrice: number): number {
  if (type === "early-bird") {
    return basePrice * 0.8;
  } else if (type === "student") {
    return basePrice * 0.5;
  } else {
    return basePrice * 1.5;
  }
}
