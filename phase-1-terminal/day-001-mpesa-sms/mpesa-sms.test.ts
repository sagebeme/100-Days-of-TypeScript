import { describe, it, expect } from "vitest";
import { buildConfirmation } from "./starter/mpesa-sms.ts";

describe("buildConfirmation", () => {
  it("builds the confirmation text from a code, an amount and a name", () => {
    expect(buildConfirmation("QFT1ABC2DE", 500, "Amina Wanjiru")).toBe(
      "QFT1ABC2DE Confirmed. Ksh500.00 sent to Amina Wanjiru.",
    );
  });

  it("works for a different code, amount and name", () => {
    expect(buildConfirmation("RKD4XY7Z1P", 1250, "Kip")).toBe("RKD4XY7Z1P Confirmed. Ksh1250.00 sent to Kip.");
  });

  it("starts with the transaction code, then the status", () => {
    expect(buildConfirmation("SAB1C2D3E4", 20, "Zawadi")).toMatch(/^SAB1C2D3E4 Confirmed\. /);
  });

  it("puts the amount right after Ksh, with no space", () => {
    expect(buildConfirmation("SAB1C2D3E4", 20, "Zawadi")).toContain(" Ksh20.00 ");
  });
});
