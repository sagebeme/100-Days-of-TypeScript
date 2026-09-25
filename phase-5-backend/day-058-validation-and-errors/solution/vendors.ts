export interface Vendor {
  id: string;
  name: string;
  dish: string; // "smokie pasua", "mutura", "chapo beans"
  area: string;
  latitude: number;
  longitude: number;
  priceKes: number; // a typical plate
  rating: number | null; // average of reviews, 1 decimal place
  reviewCount: number;
}

// What a client sends to create or replace a vendor: no id, no rating (those are the server's job).
export type VendorInput = Pick<Vendor, "name" | "dish" | "area" | "latitude" | "longitude" | "priceKes">;

export interface VendorQuery {
  area?: string;
  dish?: string;
  maxPrice?: number;
  near?: { latitude: number; longitude: number };
  sort?: "price" | "rating" | "distance" | "name";
  limit: number;
  offset: number;
}

export interface Page<T> {
  data: T[];
  total: number; // matches before paging
  limit: number;
  offset: number;
}

export type VendorWithDistance = Vendor & { distanceKm?: number };

// The repository: the only code that knows where vendors are kept. Routes only talk to this interface,
// so on Day 59 an SQLite version can replace this in-memory one without touching a single route.
export interface VendorRepository {
  list(query: VendorQuery): Page<VendorWithDistance>;
  get(id: string): Vendor | undefined;
  create(input: VendorInput): Vendor;
  replace(id: string, input: VendorInput): Vendor | undefined;
  update(id: string, changes: Partial<VendorInput>): Vendor | undefined;
  remove(id: string): boolean;
  review(id: string, stars: number): Vendor | undefined;
}

// Straight-line distance on the Earth's surface (the haversine formula), in kilometres.
export function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function createMemoryRepository(seed: Vendor[] = [], makeId: () => string = () => crypto.randomUUID()): VendorRepository {
  const vendors = new Map(seed.map((v) => [v.id, { ...v }]));
  const stars = new Map<string, number[]>();

  const rate = (vendor: Vendor): Vendor => {
    const all = stars.get(vendor.id) ?? [];
    return all.length === 0
      ? vendor
      : { ...vendor, reviewCount: all.length, rating: Math.round((all.reduce((a, b) => a + b, 0) / all.length) * 10) / 10 };
  };

  return {
    list(query) {
      const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
      let found: VendorWithDistance[] = [...vendors.values()]
        .map(rate)
        .filter(
          (v) =>
            (!query.area || same(v.area, query.area)) &&
            (!query.dish || v.dish.toLowerCase().includes(query.dish.toLowerCase())) &&
            (query.maxPrice === undefined || v.priceKes <= query.maxPrice),
        );
      if (query.near) {
        const near = query.near;
        found = found.map((v) => ({ ...v, distanceKm: Math.round(distanceKm(near, v) * 10) / 10 }));
      }
      const sort = query.sort ?? (query.near ? "distance" : "name");
      const by: Record<string, (a: VendorWithDistance, b: VendorWithDistance) => number> = {
        price: (a, b) => a.priceKes - b.priceKes,
        rating: (a, b) => (b.rating ?? -1) - (a.rating ?? -1),
        distance: (a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0),
        name: () => 0,
      };
      found.sort((a, b) => by[sort](a, b) || a.name.localeCompare(b.name));
      return { data: found.slice(query.offset, query.offset + query.limit), total: found.length, limit: query.limit, offset: query.offset };
    },
    get(id) {
      const vendor = vendors.get(id);
      return vendor && rate(vendor);
    },
    create(input) {
      const vendor: Vendor = { id: makeId(), ...input, rating: null, reviewCount: 0 };
      vendors.set(vendor.id, vendor);
      return vendor;
    },
    replace(id, input) {
      const existing = vendors.get(id);
      if (!existing) return undefined;
      const replaced = { ...existing, ...input };
      vendors.set(id, replaced);
      return rate(replaced);
    },
    update(id, changes) {
      const existing = vendors.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...changes };
      vendors.set(id, updated);
      return rate(updated);
    },
    remove(id) {
      stars.delete(id);
      return vendors.delete(id);
    },
    review(id, rating) {
      const vendor = vendors.get(id);
      if (!vendor) return undefined;
      stars.set(id, [...(stars.get(id) ?? []), rating]);
      return rate(vendor);
    },
  };
}
