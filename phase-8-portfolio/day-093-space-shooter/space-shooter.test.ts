import { describe, it, expect } from "vitest";
import { newWorld, update, advance, random, overlaps, marchSpeed, formation, WIDTH, STEP, COOLDOWN, SHIELD, PLAYER_SPEED, type World, type Keys } from "./starter/engine.ts";

const none: Keys = { left: false, right: false, fire: false };
const run = (world: World, keys: Keys, steps: number) => Array.from({ length: steps }).reduce<World>((w) => update(w, keys), world);
// A world where the enemies never fire: find a seed whose rolls stay high for a while.
function quietSeed(): number {
  for (let seed = 1; seed < 10_000; seed++) {
    let s = seed;
    let quiet = true;
    for (let i = 0; i < 120 && quiet; i++) {
      const r = random(s);
      s = r.seed;
      if (r.value < 0.05) quiet = false;
    }
    if (quiet) return seed;
  }
  throw new Error("no quiet seed");
}

describe("randomness you can repeat", () => {
  it("gives the same numbers from the same seed, between 0 and 1", () => {
    const a = random(42);
    expect(random(42)).toEqual(a);
    expect(a.value).toBeGreaterThanOrEqual(0);
    expect(a.value).toBeLessThan(1);
    expect(random(a.seed).value).not.toBe(a.value);
  });

  it("plays the same game twice from the same seed and keys", () => {
    const keys = { left: false, right: true, fire: true };
    expect(run(newWorld(7), keys, 600)).toEqual(run(newWorld(7), keys, 600));
  });
});

describe("the player", () => {
  it("moves at a steady speed and stays on screen", () => {
    const w = newWorld(quietSeed());
    const moved = run(w, { ...none, right: true }, 30);
    expect(moved.player.x - w.player.x).toBeCloseTo(PLAYER_SPEED * STEP * 30, 5);
    const edge = run(w, { ...none, left: true }, 600);
    expect(edge.player.x).toBe(edge.player.w / 2);
    expect(run(w, { ...none, right: true }, 600).player.x).toBe(WIDTH - w.player.w / 2);
  });

  it("fires, but no faster than the cooldown allows", () => {
    const w = run(newWorld(quietSeed()), { ...none, fire: true }, Math.round(COOLDOWN / STEP) * 3 - 1);
    expect(w.shots.length + (w.score > 0 ? 1 : 0)).toBeLessThanOrEqual(3);
    expect(update(newWorld(), { ...none, fire: true }).shots).toHaveLength(1);
  });

  it("never changes the world it was given", () => {
    const w = newWorld();
    const copy = JSON.stringify(w);
    update(w, { left: true, right: false, fire: true });
    expect(JSON.stringify(w)).toBe(copy);
  });
});

describe("the formation", () => {
  it("marches across, then steps down and turns at the edge", () => {
    let w = newWorld(quietSeed());
    const startY = w.enemies[0].y;
    let steps = 0;
    while (w.enemies[0].y === startY && steps++ < 2000) {
      const before = w.enemies[0].x;
      w = update(w, none);
      if (w.enemies[0].y === startY) expect(w.enemies[0].x).toBeGreaterThan(before); // still marching right
    }
    expect(w.enemies[0].y).toBe(startY + 16); // one step down…
    expect(w.direction).toBe(-1); // …and now heading left
    for (const e of w.enemies) expect(e.x + e.w / 2).toBeLessThanOrEqual(WIDTH);
  });

  it("speeds up as it thins out, and wave by wave", () => {
    expect(marchSpeed(10, 1)).toBeGreaterThan(marchSpeed(40, 1));
    expect(marchSpeed(40, 3)).toBeGreaterThan(marchSpeed(40, 1));
    expect(formation(1)).toHaveLength(40);
    expect(formation(3)[0].y).toBeGreaterThan(formation(1)[0].y);
  });
});

describe("hits", () => {
  it("knows when two boxes overlap", () => {
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 9, y: 0, w: 10, h: 10 })).toBe(true);
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
  });

  it("a shot destroys an enemy, and scores by its row", () => {
    const w = newWorld(quietSeed());
    const target = w.enemies[0]; // top row: 50 points
    const aimed: World = { ...w, shots: [{ x: target.x, y: target.y + 20, w: 4, h: 14 }], direction: 1 };
    const after = run(aimed, none, 3);
    expect(after.enemies).toHaveLength(39);
    expect(after.score).toBe(50);
    expect(after.shots).toHaveLength(0);
  });

  it("a bomb costs a life, then shields the player for a moment", () => {
    const w = newWorld(quietSeed());
    const bombed: World = { ...w, bombs: [{ x: w.player.x, y: w.player.y - 10, w: 4, h: 12 }, { x: w.player.x, y: w.player.y - 30, w: 4, h: 12 }] };
    const hit = run(bombed, none, 2);
    expect(hit.player.lives).toBe(2);
    expect(hit.player.shield).toBeGreaterThan(SHIELD - 0.1);
    expect(run(hit, none, 10).player.lives).toBe(2); // the second bomb arrives during the shield
  });

  it("ends the game with the last life, or when the aliens land", () => {
    const w = newWorld(quietSeed());
    const lastLife: World = { ...w, player: { ...w.player, lives: 1 }, bombs: [{ x: w.player.x, y: w.player.y, w: 4, h: 12 }] };
    expect(update(lastLife, none).status).toBe("over");
    const landing: World = { ...w, enemies: [{ ...w.enemies[0], x: 200, y: w.player.y - 10 }] };
    const over = update(landing, none);
    expect(over.status).toBe("over");
    expect(update(over, { ...none, fire: true })).toBe(over); // nothing moves after the end
  });

  it("brings the next wave when one is cleared", () => {
    const w = newWorld(quietSeed());
    const last: World = { ...w, enemies: [w.enemies[0]], shots: [{ x: w.enemies[0].x, y: w.enemies[0].y, w: 4, h: 14 }] };
    const next = update(last, none);
    expect(next.wave).toBe(2);
    expect(next.enemies).toHaveLength(40);
  });
});

describe("the fixed-step loop", () => {
  it("moves the same amount whatever the frame rate", () => {
    const w = newWorld(quietSeed());
    const keys = { ...none, right: true };
    const at = (fps: number) => {
      let world = w;
      let carry = 0;
      for (let i = 0; i < fps; i++) ({ world, carry } = advance(world, keys, 1 / fps, carry));
      return world;
    };
    expect(at(30).player.x).toBeCloseTo(at(144).player.x, 5);
    expect(at(30).time).toBeCloseTo(1, 5);
  });

  it("carries the leftover time, and doesn't try to catch up after a long pause", () => {
    const { carry, steps } = advance(newWorld(), none, 0.04, 0);
    expect(steps).toBe(2);
    expect(carry).toBeCloseTo(0.04 - 2 * STEP, 9);
    expect(advance(newWorld(), none, 30, 0).steps).toBe(15); // at most a quarter of a second
  });
});

