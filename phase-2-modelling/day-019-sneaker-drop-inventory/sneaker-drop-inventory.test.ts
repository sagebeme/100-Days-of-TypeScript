import { describe, it, expect } from "vitest";
import { Store, totalStock, type Sneaker } from "./starter/store.ts";

const aj1: Sneaker = { id: "aj1", model: "Air Jordan 1", sizeUs: 9, stock: 3 };
const dunk: Sneaker = { id: "dunk", model: "Nike Dunk Low", sizeUs: 10, stock: 5 };

describe("Store", () => {
  it("adds items and finds them by id", () => {
    const store = new Store<Sneaker>();
    store.add(aj1);
    expect(store.get("aj1")).toEqual(aj1);
    expect(store.get("nope")).toBeUndefined();
    expect(store.size).toBe(1);
  });

  it("rejects an item with an id that is already stored", () => {
    const store = new Store<Sneaker>();
    store.add(aj1);
    expect(() => store.add({ ...dunk, id: "aj1" })).toThrow("Duplicate id: aj1");
    expect(store.size).toBe(1);
  });

  it("removes items and says whether it did", () => {
    const store = new Store<Sneaker>();
    store.add(aj1);
    store.add(dunk);
    expect(store.remove("aj1")).toBe(true);
    expect(store.remove("aj1")).toBe(false);
    expect(store.all()).toEqual([dunk]);
  });

  it("returns a copy from all(), so changing it does not change the store", () => {
    const store = new Store<Sneaker>();
    store.add(aj1);
    const everything = store.all();
    everything.push(dunk);
    expect(store.size).toBe(1);
    expect(store.all()).toEqual([aj1]);
  });

  it("works with any type that has an id", () => {
    const caps = new Store<{ id: string; colour: string }>();
    caps.add({ id: "cap-1", colour: "green" });
    expect(caps.get("cap-1")?.colour).toBe("green");
  });
});

describe("totalStock", () => {
  it("adds up the stock across all sneakers", () => {
    const store = new Store<Sneaker>();
    store.add(aj1);
    store.add(dunk);
    expect(totalStock(store)).toBe(8);
  });

  it("is 0 for an empty store", () => {
    expect(totalStock(new Store<Sneaker>())).toBe(0);
  });
});
