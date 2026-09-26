import { transliterate } from "./transliterate.ts";

export interface SlugifyOptions {
  separator?: string;
  lowercase?: boolean;
  maxLength?: number;
}

export function slugify(text: string, options: SlugifyOptions = {}): string {
  const separator = options.separator ?? "-";
  let slug = transliterate(text).trim();

  slug = slug.replace(/['’]/g, ""); // "it's" -> "its"
  slug = slug.replace(/\s+/g, separator); // words -> separators
  slug = slug.replace(/[^A-Za-z0-9_-]/g, ""); // drop everything else

  if (options.lowercase !== false) slug = slug.toLowerCase();

  if (options.maxLength !== undefined && slug.length > options.maxLength) {
    const cut = slug.slice(0, options.maxLength);
    const lastSeparator = cut.lastIndexOf(separator);
    slug = lastSeparator > 0 && slug[options.maxLength] !== separator ? cut.slice(0, lastSeparator) : cut;
  }
  return slug;
}
