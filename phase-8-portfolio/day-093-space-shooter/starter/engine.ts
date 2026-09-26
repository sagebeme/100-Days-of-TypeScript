// The game, with no canvas: a world, and a function that moves it on by one small, fixed step.
// The tests are the spec.
// Same world + same keys = same result, every time. That's what makes a game testable (and fair).

export const WIDTH = 480;
export const HEIGHT = 640;
export const STEP = 1 / 60; // seconds per update, whatever the screen's frame rate

export interface Box {
  x: number; // centre
  y: number;
  w: number;
  h: number;
}

export interface Enemy extends Box {
  row: number; // 0 is the top row: worth the most
}

export interface World {
  player: Box & { lives: number; cooldown: number; shield: number }; // shield: seconds of invulnerability left
  shots: Box[]; // going up
  bombs: Box[]; // coming down
  enemies: Enemy[];
  direction: 1 | -1; // the formation's way across
  score: number;
  wave: number;
  status: "playing" | "over";
  seed: number; // the random number generator's state: part of the world, so replays match
  time: number;
}

export interface Keys {
  left: boolean;
  right: boolean;
  fire: boolean;
}

export const PLAYER_SPEED = 260; // px per second
export const SHOT_SPEED = 520;
export const BOMB_SPEED = 220;
export const COOLDOWN = 0.3; // seconds between shots
export const SHIELD = 2;
export const POINTS = [50, 30, 30, 10, 10]; // by row, top first

export function random(seed: number): { value: number; seed: number } {
  throw new Error(`TODO: random(${seed})`);
}

export function formation(wave: number): Enemy[] {
  throw new Error(`TODO: formation(${wave})`);
}

export function newWorld(seed = 1): World {
  throw new Error(`TODO: newWorld(${seed})`);
}

export function overlaps(a: Box, b: Box): boolean {
  throw new Error(`TODO: overlaps(${a.x}, ${b.x})`);
}

export function marchSpeed(enemiesLeft: number, wave: number): number {
  throw new Error(`TODO: marchSpeed(${enemiesLeft}, ${wave})`);
}

export function update(world: World, keys: Keys): World {
  throw new Error(`TODO: update(${world.time}, ${JSON.stringify(keys)})`);
}

export function advance(world: World, keys: Keys, elapsed: number, carry: number): { world: World; carry: number; steps: number } {
  throw new Error(`TODO: advance(${world.time}, ${JSON.stringify(keys)}, ${elapsed}, ${carry})`);
}
