import { VendorInputSchema, type VendorInput } from "./schemas.ts";

// A preview of Phase 6: a web form checking itself with the SAME schema the server uses.
// Form fields are always text, so numbers are converted first, then the shared schema decides.
export type FormResult = { ok: true; value: VendorInput } | { ok: false; errors: Record<string, string> };

export function checkVendorForm(fields: Record<string, string>): FormResult {
  const toNumber = (value: string | undefined) => (value === undefined || value.trim() === "" ? undefined : Number(value));
  const result = VendorInputSchema.safeParse({
    ...fields,
    latitude: toNumber(fields.latitude),
    longitude: toNumber(fields.longitude),
    priceKes: toNumber(fields.priceKes),
  });
  if (result.success) return { ok: true, value: result.data };

  // One message per field (the first), ready to show under each input.
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? "");
    errors[field] ??= issue.message;
  }
  return { ok: false, errors };
}
