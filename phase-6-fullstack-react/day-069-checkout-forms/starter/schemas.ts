import { z } from "zod";

// ONE definition of a valid order, used in two places: the checkout form in the browser, and the
// API on the server (see vite.config.ts). The form catches mistakes instantly; the server still
// checks, because anyone can send anything to an API. Sharing the schema means the two can never
// disagree about what "valid" means.

// TODO: "0712 345 678", "+254 712 345 678", "0110-123-456" -> "254712345678".
// A z.string().transform((value, ctx) => ...): remove spaces and dashes, match 07/01 numbers with
// 0, 254 or +254 in front, and return "254" + the 9 digits. Anything else:
//   ctx.addIssue({ code: "custom", message: "Enter a Safaricom number like 0712 345 678" }); return z.NEVER;
export const SafaricomPhone = z.string();

// TODO: the rules, and the messages people see:
// - name: trimmed, 2 to 60 characters. "Enter your name, as it should appear on the tickets" / "Use 60 characters or fewer"
// - email: trimmed and lowercased first, THEN checked (.pipe(z.email(...))). "Enter an email like amina@example.com"
// - phone: SafaricomPhone
// - agree: z.literal(true, "Tick the box to agree to the terms")
export const CheckoutSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: SafaricomPhone,
  agree: z.boolean(),
});

// Already written: what the browser sends is the form, plus what's in the cart. Extended, not copied.
export const OrderRequestSchema = CheckoutSchema.extend({
  lines: z
    .array(z.object({ tierId: z.string().min(1), quantity: z.number().int().min(1).max(10) }))
    .min(1, "Your cart is empty"),
});

export type CheckoutInput = z.input<typeof CheckoutSchema>; // what the form holds: phone as typed
export type CheckoutValues = z.output<typeof CheckoutSchema>; // after checking: phone as 2547...
export type OrderRequest = z.output<typeof OrderRequestSchema>;

// TODO: the first message for each field, from error.issues: { phone: "Enter a Safaricom number..." }.
// The field is issue.path[0]; an issue with no path belongs to "form".
export function fieldErrors(error: z.ZodError): Record<string, string> {
  void error;
  return {};
}
