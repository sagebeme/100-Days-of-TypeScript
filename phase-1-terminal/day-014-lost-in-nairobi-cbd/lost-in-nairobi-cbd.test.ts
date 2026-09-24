import { describe, it, expect } from "vitest";
import { nairobiCbdWorld, move, isEnding, type World } from "./starter/nairobi-cbd.ts";

const tinyWorld: World = {
  a: { id: "a", description: "Room A", exits: { east: "b" } },
  b: { id: "b", description: "Room B", exits: { west: "a" }, isEnding: true },
};

describe("move", () => {
  it("follows an exit to the room it points at", () => {
    expect(move(tinyWorld, "a", "east")).toBe("b");
  });

  it("stays in the same room when there is no exit that way", () => {
    expect(move(tinyWorld, "a", "north")).toBe("a");
  });

  it("throws for a room that is not in the world", () => {
    expect(() => move(tinyWorld, "nowhere", "east")).toThrow("Unknown room: nowhere");
  });
});

describe("isEnding", () => {
  it("is true for a room flagged as an ending", () => {
    expect(isEnding(tinyWorld, "b")).toBe(true);
  });

  it("is false for a room with no flag", () => {
    expect(isEnding(tinyWorld, "a")).toBe(false);
  });

  it("is false for a room that does not exist", () => {
    expect(isEnding(tinyWorld, "nowhere")).toBe(false);
  });
});

describe("nairobiCbdWorld", () => {
  it("has the required rooms", () => {
    for (const id of ["bus-stage", "tom-mboya-street", "kencom", "uhuru-park"]) {
      expect(nairobiCbdWorld[id], `missing room "${id}"`).toBeDefined();
    }
  });

  it("stores each room under its own id", () => {
    expect(Object.keys(nairobiCbdWorld).length).toBeGreaterThan(0);
    for (const [key, room] of Object.entries(nairobiCbdWorld)) {
      expect(room.id).toBe(key);
    }
  });

  it("has descriptions for every room", () => {
    expect(Object.keys(nairobiCbdWorld).length).toBeGreaterThan(0);
    for (const room of Object.values(nairobiCbdWorld)) {
      expect(room.description.length, `room "${room.id}" needs a description`).toBeGreaterThan(0);
    }
  });

  it("only has exits that point at rooms that exist", () => {
    expect(Object.keys(nairobiCbdWorld).length).toBeGreaterThan(0);
    for (const room of Object.values(nairobiCbdWorld)) {
      for (const [direction, target] of Object.entries(room.exits)) {
        expect(nairobiCbdWorld[target], `${room.id} -> ${direction} -> "${target}" does not exist`).toBeDefined();
      }
    }
  });

  it("starts at a room that is not an ending", () => {
    expect(isEnding(nairobiCbdWorld, "bus-stage")).toBe(false);
  });

  it("lets you walk from the bus stage to Uhuru Park", () => {
    let here = "bus-stage";
    here = move(nairobiCbdWorld, here, "north");
    expect(here).toBe("tom-mboya-street");
    here = move(nairobiCbdWorld, here, "north");
    expect(here).toBe("kencom");
    here = move(nairobiCbdWorld, here, "north");
    expect(here).toBe("uhuru-park");
    expect(isEnding(nairobiCbdWorld, here)).toBe(true);
  });

  it("has more than one ending", () => {
    const endings = Object.keys(nairobiCbdWorld).filter((id) => isEnding(nairobiCbdWorld, id));
    expect(endings.length).toBeGreaterThanOrEqual(2);
  });
});
