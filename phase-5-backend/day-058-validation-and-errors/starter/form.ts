import { VendorInputSchema, type VendorInput } from "./schemas.ts";

// A preview of Phase 6: a web form checking itself with the SAME schema the server uses.
// Form fields are always text, so numbers are converted first, then the shared schema decides.
export type FormResult = { ok: true; value: VendorInput } | { ok: false; errors: Record<string, string> };

export function checkVendorForm(fields: Record<string, string>): FormResult {
  // TODO: turn latitude, longitude and priceKes into numbers (a blank field becomes undefined),
  //   then VendorInputSchema.safeParse
  // TODO: ok -> { ok: true, value }; otherwise { ok: false, errors } with ONE message per field (the first)
  void VendorInputSchema;
  throw new Error("not implemented yet");
}
