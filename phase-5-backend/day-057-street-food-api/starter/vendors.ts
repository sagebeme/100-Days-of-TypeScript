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
  // TODO: the haversine formula, with the Earth's radius as 6371 km:
  //   h = sin²(Δlat/2) + cos(lat1) · cos(lat2) · sin²(Δlon/2);  distance = 6371 · 2 · asin(√h)
  //   (the angles in radians: degrees × π / 180)
  throw new Error("not implemented yet");
}

export function createMemoryRepository(seed: Vendor[] = [], makeId: () => string = () => crypto.randomUUID()): VendorRepository {
  // TODO: keep vendors in a Map by id (copies of the seed), and each vendor's review stars in another Map
  // TODO: every vendor you return has rating (the average of its stars, to 1 decimal place) and reviewCount
  //   worked out from its stars; with no reviews, rating stays null and reviewCount 0
  // TODO: list(query):
  //   filter: area (exact, any case), dish (contains, any case), maxPrice (at most)
  //   near: add distanceKm (1 decimal place) to each vendor
  //   sort: price (cheapest first), rating (best first, unrated last), distance (closest first), name;
  //     no sort given -> "distance" when near is set, otherwise "name". Ties are broken by name A-Z.
  //   then page it: { data: the slice from offset, limit long; total: how many matched before paging; limit; offset }
  // TODO: get / create (a new id, rating null, reviewCount 0) / replace / update / remove / review(id, stars)
  //   return undefined (or false for remove) when the id doesn't exist
  throw new Error("not implemented yet");
}
