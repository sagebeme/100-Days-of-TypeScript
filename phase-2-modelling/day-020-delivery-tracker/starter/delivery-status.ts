export type DeliveryStatus =
  | { kind: "preparing"; restaurant: string; etaMinutes: number }
  | { kind: "on-the-way"; rider: string; etaMinutes: number }
  | { kind: "delivered"; deliveredAt: string }
  | { kind: "cancelled"; reason: string };

export function describeStatus(status: DeliveryStatus): string {
  // TODO: switch on status.kind and return the sentence for each shape (see the README)
  // TODO: finish with a default branch that assigns status to a `never` variable
  throw new Error("not implemented yet");
}

export function isFinished(status: DeliveryStatus): boolean {
  // TODO: true for "delivered" and "cancelled", false for the rest
  throw new Error("not implemented yet");
}

export function minutesRemaining(status: DeliveryStatus): number {
  // TODO: etaMinutes for "preparing" and "on-the-way", 0 for the finished states
  throw new Error("not implemented yet");
}
