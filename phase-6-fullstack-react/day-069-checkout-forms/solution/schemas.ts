import { z } from "zod";

// ONE definition of a valid order, used in two places: the checkout form in the browser, and the
// API on the server (see vite.config.ts). The form catches mistakes instantly; the server still
// checks, because anyone can send anything to an API. Sharing the schema means the two can never
// disagree about what "valid" means.

// "0712 345 678", "+254 712 345 678", "0110-123-456" -> "254712345678". Anything else: an error.
export const SafaricomPhone = z.string().transform((value, ctx) => {
  const digits = value.replace(/[\s-]/g, "");
  const match = /^(?:\+?254|0)([17]\d{8})$/.exec(digits);
  if (!match) {
    ctx.addIssue({ code: "custom", message: "Enter a Safaricom number like 0712 345 678" });
    return z.NEVER;
  }
  return `254${match[1]}`;
});

export const CheckoutSchema = z.object({
  name: z.string().trim().min(2, "Enter your name, as it should appear on the tickets").max(60, "Use 60 characters or fewer"),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter an email like amina@example.com")),
  phone: SafaricomPhone,
  agree: z.literal(true, "Tick the box to agree to the terms"),
});

// What the browser sends: the form, plus what's in the cart.
export const OrderRequestSchema = CheckoutSchema.extend({
  lines: z
    .array(z.object({ tierId: z.string().min(1), quantity: z.number().int().min(1).max(10) }))
    .min(1, "Your cart is empty"),
});

export type CheckoutInput = z.input<typeof CheckoutSchema>; // what the form holds: phone as typed
export type CheckoutValues = z.output<typeof CheckoutSchema>; // after checking: phone as 2547...
export type OrderRequest = z.output<typeof OrderRequestSchema>;

// The field errors in a form the UI can show: the first message for each field.
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    errors[field] ??= issue.message;
  }
  return errors;
}
