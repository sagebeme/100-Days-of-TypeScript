import { describe, it, expect } from "vitest";
import { describeStatus, isFinished, minutesRemaining, type DeliveryStatus } from "./starter/delivery-status.ts";

const preparing: DeliveryStatus = { kind: "preparing", restaurant: "Mama Njeri's Kibanda", etaMinutes: 20 };
const onTheWay: DeliveryStatus = { kind: "on-the-way", rider: "Wanjiru", etaMinutes: 12 };
const delivered: DeliveryStatus = { kind: "delivered", deliveredAt: "7:45 PM" };
const cancelled: DeliveryStatus = { kind: "cancelled", reason: "Restaurant closed" };

describe("describeStatus", () => {
  it("describes an order being prepared", () => {
    expect(describeStatus(preparing)).toBe("Mama Njeri's Kibanda is preparing your order (about 20 min)");
  });

  it("describes an order on the way", () => {
    expect(describeStatus(onTheWay)).toBe("Wanjiru is on the way, arriving in 12 min");
  });

  it("describes a delivered order", () => {
    expect(describeStatus(delivered)).toBe("Delivered at 7:45 PM");
  });

  it("describes a cancelled order", () => {
    expect(describeStatus(cancelled)).toBe("Cancelled: Restaurant closed");
  });
});

describe("isFinished", () => {
  it("is true for delivered and cancelled", () => {
    expect(isFinished(delivered)).toBe(true);
    expect(isFinished(cancelled)).toBe(true);
  });

  it("is false while the order is still moving", () => {
    expect(isFinished(preparing)).toBe(false);
    expect(isFinished(onTheWay)).toBe(false);
  });
});

describe("minutesRemaining", () => {
  it("uses the eta while the order is moving", () => {
    expect(minutesRemaining(preparing)).toBe(20);
    expect(minutesRemaining(onTheWay)).toBe(12);
  });

  it("is 0 once the order is finished", () => {
    expect(minutesRemaining(delivered)).toBe(0);
    expect(minutesRemaining(cancelled)).toBe(0);
  });
});
