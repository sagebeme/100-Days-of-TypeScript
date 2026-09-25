import { z } from "zod";

// Shared schemas: the server checks requests with these, and in Phase 6 the web app checks its forms
// with the very same ones. One set of rules, so the browser and the server can never disagree.

const text = (field: string) => z.string({ error: `${field} is required` }).trim().min(1, `${field} can't be empty`);

export const VendorInputSchema = z.object({
  name: text("name").max(80, "name can be at most 80 characters"),
  dish: text("dish").max(40, "dish can be at most 40 characters"),
  area: text("area").max(40, "area can be at most 40 characters"),
  latitude: z.number({ error: "latitude must be a number" }).min(-90, "latitude must be from -90 to 90").max(90, "latitude must be from -90 to 90"),
  longitude: z.number({ error: "longitude must be a number" }).min(-180, "longitude must be from -180 to 180").max(180, "longitude must be from -180 to 180"),
  priceKes: z.number({ error: "priceKes must be a number" }).int("priceKes must be whole shillings").positive("priceKes must be above 0"),
});

// PATCH: any of the same fields, at least one, and nothing else. `.strict()` turns a typo like
// "prize" into an error instead of silently ignoring it.
export const VendorPatchSchema = VendorInputSchema.partial()
  .strict()
  .refine((changes) => Object.keys(changes).length > 0, "Send at least one field to change");

const near = z
  .string()
  .regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, "near must be latitude,longitude, like -1.2833,36.8167")
  .transform((value) => {
    const [latitude, longitude] = value.split(",").map(Number);
    return { latitude, longitude };
  });

// Query strings are always text, so numbers are coerced.
export const VendorQuerySchema = z
  .object({
    area: z.string().optional(),
    dish: z.string().optional(),
    maxPrice: z.coerce.number().int().positive("maxPrice must be above 0").optional(),
    near: near.optional(),
    sort: z.enum(["price", "rating", "distance", "name"], { error: "sort must be price, rating, distance or name" }).optional(),
    limit: z.coerce.number().int().min(1, "limit must be from 1 to 50").max(50, "limit must be from 1 to 50").default(10),
    offset: z.coerce.number().int().min(0, "offset must be 0 or more").default(0),
  })
  .refine((q) => q.sort !== "distance" || q.near !== undefined, { message: "sort=distance needs near", path: ["sort"] });

export const ReviewSchema = z.object({
  stars: z.number({ error: "stars must be a number" }).int("stars must be whole").min(1, "stars must be from 1 to 5").max(5, "stars must be from 1 to 5"),
});

export const IdParamSchema = z.object({ id: z.string().regex(/^[a-z0-9-]{1,60}$/, "that isn't a vendor id") });

export type VendorInput = z.infer<typeof VendorInputSchema>;
export type VendorPatch = z.infer<typeof VendorPatchSchema>;
export type VendorQueryInput = z.infer<typeof VendorQuerySchema>;
