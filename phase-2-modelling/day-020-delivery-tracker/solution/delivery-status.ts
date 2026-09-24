export type DeliveryStatus =
  | { kind: "preparing"; restaurant: string; etaMinutes: number }
  | { kind: "on-the-way"; rider: string; etaMinutes: number }
  | { kind: "delivered"; deliveredAt: string }
  | { kind: "cancelled"; reason: string };

export function describeStatus(status: DeliveryStatus): string {
  switch (status.kind) {
    case "preparing":
      return `${status.restaurant} is preparing your order (about ${status.etaMinutes} min)`;
    case "on-the-way":
      return `${status.rider} is on the way, arriving in ${status.etaMinutes} min`;
    case "delivered":
      return `Delivered at ${status.deliveredAt}`;
    case "cancelled":
      return `Cancelled: ${status.reason}`;
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

export function isFinished(status: DeliveryStatus): boolean {
  return status.kind === "delivered" || status.kind === "cancelled";
}

export function minutesRemaining(status: DeliveryStatus): number {
  switch (status.kind) {
    case "preparing":
    case "on-the-way":
      return status.etaMinutes;
    case "delivered":
    case "cancelled":
      return 0;
  }
}
