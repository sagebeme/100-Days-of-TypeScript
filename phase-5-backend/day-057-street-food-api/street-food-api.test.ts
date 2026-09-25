import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "./starter/app.ts";
import { createMemoryRepository, distanceKm, type Vendor, type VendorInput } from "./starter/vendors.ts";
import { SEED } from "./starter/seed.ts";

const ARCHIVES = { latitude: -1.2833, longitude: 36.8167 }; // the Kenya National Archives, in the CBD

const newVendor: VendorInput = {
  name: "Tom Mboya Mahindi Choma",
  dish: "mahindi choma",
  area: "CBD",
  latitude: -1.2839,
  longitude: 36.8262,
  priceKes: 40,
};

describe("distanceKm", () => {
  it("measures a short walk across the CBD", () => {
    expect(distanceKm(ARCHIVES, { latitude: -1.2855, longitude: 36.8203 })).toBeCloseTo(0.47, 2);
  });

  it("measures Nairobi to Mombasa as the crow flies", () => {
    expect(distanceKm({ latitude: -1.2921, longitude: 36.8219 }, { latitude: -4.0435, longitude: 39.6682 })).toBeCloseTo(440, -1);
  });

  it("is zero from a place to itself", () => {
    expect(distanceKm(ARCHIVES, ARCHIVES)).toBe(0);
  });
});

describe("the street food API", () => {
  let app: ReturnType<typeof createApp>;
  let ids: number;

  beforeEach(() => {
    ids = 0;
    app = createApp(createMemoryRepository(SEED, () => `new-${++ids}`));
  });

  const call = async (path: string, init: RequestInit = {}) => {
    const response = await app.request(path, init);
    return { status: response.status, headers: response.headers, body: response.status === 204 ? null : await response.json() };
  };
  const send = (method: string, body: unknown) => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  describe("reading", () => {
    it("lists vendors by name, 10 at a time", async () => {
      const { status, body } = await call("/vendors");
      expect(status).toBe(200);
      expect(body.data.map((v: Vendor) => v.name)).toEqual([...SEED].map((v) => v.name).sort());
      expect(body).toMatchObject({ total: 7, limit: 10, offset: 0, next: null });
    });

    it("filters by area, dish and price", async () => {
      expect((await call("/vendors?area=cbd")).body.total).toBe(3);
      expect((await call("/vendors?dish=CHAPO")).body.data.map((v: Vendor) => v.id)).toEqual(["kilimani-chapo"]);
      expect((await call("/vendors?maxPrice=50")).body.data.map((v: Vendor) => v.id)).toEqual(["mama-njeri-smokies", "south-b-samosa"]);
    });

    it("sorts by distance when you say where you are", async () => {
      const { body } = await call(`/vendors?near=${ARCHIVES.latitude},${ARCHIVES.longitude}&limit=3`);
      expect(body.data.map((v: Vendor) => v.id)).toEqual(["kenyatta-ave-mutura", "mama-njeri-smokies", "cbd-githeri"]);
      expect(body.data[0].distanceKm).toBe(0.5);
    });

    it("sorts by price", async () => {
      const { body } = await call("/vendors?sort=price&limit=2");
      expect(body.data.map((v: Vendor) => v.priceKes)).toEqual([30, 50]);
    });

    it("pages through the results with a next link", async () => {
      const first = await call("/vendors?limit=3&area=CBD");
      expect(first.body.data).toHaveLength(3);
      expect(first.body.next).toBeNull();
      const page1 = await call("/vendors?limit=3");
      expect(page1.body.next).toBe("/vendors?limit=3&offset=3");
      const page3 = await call("/vendors?limit=3&offset=6");
      expect(page3.body.data).toHaveLength(1);
      expect(page3.body.next).toBeNull();
    });

    it("rejects bad query strings", async () => {
      expect((await call("/vendors?limit=0")).body.error).toBe("limit must be from 1 to 50");
      expect((await call("/vendors?limit=500")).status).toBe(400);
      expect((await call("/vendors?offset=-1")).body.error).toBe("offset must be 0 or more");
      expect((await call("/vendors?near=cbd")).body.error).toBe("near must be latitude,longitude, like -1.2833,36.8167");
      expect((await call("/vendors?sort=vibes")).body.error).toBe("sort must be price, rating, distance or name");
      expect((await call("/vendors?sort=distance")).body.error).toBe("sort=distance needs near=latitude,longitude");
    });

    it("gets one vendor, or a 404", async () => {
      expect((await call("/vendors/cbd-githeri")).body.dish).toBe("githeri");
      expect(await call("/vendors/nope")).toMatchObject({ status: 404, body: { error: "No vendor nope" } });
    });
  });

  describe("writing", () => {
    it("creates a vendor (201, with Location)", async () => {
      const { status, headers, body } = await call("/vendors", send("POST", newVendor));
      expect(status).toBe(201);
      expect(body).toEqual({ id: "new-1", ...newVendor, rating: null, reviewCount: 0 });
      expect(headers.get("Location")).toBe("/vendors/new-1");
      expect((await call("/vendors/new-1")).body.name).toBe(newVendor.name);
    });

    it.each([
      [{ ...newVendor, name: "  " }, "name must be some text"],
      [{ ...newVendor, priceKes: 0 }, "priceKes must be a whole number above 0"],
      [{ ...newVendor, latitude: 120 }, "latitude must be between -90 and 90"],
      [{ ...newVendor, dish: undefined }, "dish must be some text"],
    ])("won't create %j", async (vendor, message) => {
      expect(await call("/vendors", send("POST", vendor))).toMatchObject({ status: 400, body: { error: message } });
    });

    it("refuses a body that isn't a JSON object", async () => {
      expect((await call("/vendors", send("POST", [newVendor]))).body.error).toBe("Send a JSON object");
    });

    it("replaces every field with PUT", async () => {
      const { body } = await call("/vendors/cbd-githeri", send("PUT", newVendor));
      expect(body).toEqual({ id: "cbd-githeri", ...newVendor, rating: null, reviewCount: 0 });
    });

    it("needs every field for PUT", async () => {
      expect((await call("/vendors/cbd-githeri", send("PUT", { priceKes: 90 }))).status).toBe(400);
    });

    it("changes only the fields sent with PATCH", async () => {
      const { body } = await call("/vendors/cbd-githeri", send("PATCH", { priceKes: 90 }));
      expect(body).toMatchObject({ id: "cbd-githeri", name: "Githeri Express", priceKes: 90 });
    });

    it("won't PATCH the server's own fields, or nothing at all", async () => {
      expect((await call("/vendors/cbd-githeri", send("PATCH", { rating: 5 }))).body.error).toBe("rating can't be changed");
      expect((await call("/vendors/cbd-githeri", send("PATCH", {}))).body.error).toBe("Send at least one field to change");
      expect((await call("/vendors/nope", send("PATCH", { priceKes: 90 }))).status).toBe(404);
    });

    it("deletes with a 204, then it's gone", async () => {
      expect(await call("/vendors/cbd-githeri", { method: "DELETE" })).toMatchObject({ status: 204, body: null });
      expect((await call("/vendors/cbd-githeri")).status).toBe(404);
      expect((await call("/vendors/cbd-githeri", { method: "DELETE" })).status).toBe(404);
    });
  });

  describe("reviews", () => {
    it("averages the stars", async () => {
      await call("/vendors/ngara-bhajia/reviews", send("POST", { stars: 5 }));
      await call("/vendors/ngara-bhajia/reviews", send("POST", { stars: 4 }));
      const { status, body } = await call("/vendors/ngara-bhajia/reviews", send("POST", { stars: 4 }));
      expect(status).toBe(201);
      expect(body).toMatchObject({ rating: 4.3, reviewCount: 3 });
    });

    it("puts the best-rated first, and unrated last", async () => {
      await call("/vendors/south-b-samosa/reviews", send("POST", { stars: 3 }));
      await call("/vendors/cbd-githeri/reviews", send("POST", { stars: 5 }));
      const { body } = await call("/vendors?sort=rating&limit=3");
      expect(body.data.map((v: Vendor) => v.id)).toEqual(["cbd-githeri", "south-b-samosa", expect.any(String)]);
      expect(body.data[2].rating).toBeNull();
    });

    it.each([0, 6, 4.5, "5"])("rejects %j stars", async (stars) => {
      expect((await call("/vendors/ngara-bhajia/reviews", send("POST", { stars }))).body.error).toBe(
        "stars must be a whole number from 1 to 5",
      );
    });
  });
});
