// The game, with no canvas: a world, and a function that moves it on by one small, fixed step.
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

// mulberry32: a tiny random number generator that takes a seed, so "random" is repeatable.
export function random(seed: number): { value: number; seed: number } {
  let t = (seed + 0x6d2b79f5) >>> 0;
  let r = Math.imul(t ^ (t >>> 15), t | 1);
  r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
  return { value: ((r ^ (r >>> 14)) >>> 0) / 4294967296, seed: t };
}

export function formation(wave: number): Enemy[] {
  const enemies: Enemy[] = [];
  const top = 80 + Math.min(wave - 1, 4) * 16; // each wave starts a little lower
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 8; col++) enemies.push({ x: 72 + col * 48, y: top + row * 40, w: 32, h: 24, row });
  }
  return enemies;
}

export function newWorld(seed = 1): World {
  return {
    player: { x: WIDTH / 2, y: HEIGHT - 48, w: 40, h: 24, lives: 3, cooldown: 0, shield: 0 },
    shots: [],
    bombs: [],
    enemies: formation(1),
    direction: 1,
    score: 0,
    wave: 1,
    status: "playing",
    seed,
    time: 0,
  };
}

export const overlaps = (a: Box, b: Box) => Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;

// How fast the formation marches: faster in later waves, and much faster as it thins out.
export function marchSpeed(enemiesLeft: number, wave: number): number {
  return (30 + (40 - enemiesLeft) * 3.5) * (1 + (wave - 1) * 0.15);
}

// One step of the game. Returns a new world; the old one is never changed.
export function update(world: World, keys: Keys): World {
  if (world.status === "over") return world;
  const dt = STEP;
  let { seed, score } = world;
  const player = { ...world.player };

  // The player: moves, stays on screen, fires when the cooldown allows.
  const move = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  player.x = Math.min(WIDTH - player.w / 2, Math.max(player.w / 2, player.x + move * PLAYER_SPEED * dt));
  player.cooldown = Math.max(0, player.cooldown - dt);
  player.shield = Math.max(0, player.shield - dt);
  let shots = world.shots.map((s) => ({ ...s, y: s.y - SHOT_SPEED * dt })).filter((s) => s.y > -s.h);
  if (keys.fire && player.cooldown === 0) {
    shots.push({ x: player.x, y: player.y - player.h / 2 - 8, w: 4, h: 14 });
    player.cooldown = COOLDOWN;
  }

  // The formation: marches across; at an edge it steps down and turns round.
  let direction = world.direction;
  const speed = marchSpeed(world.enemies.length, world.wave);
  let enemies = world.enemies.map((e) => ({ ...e, x: e.x + direction * speed * dt }));
  const hitsEdge = enemies.some((e) => e.x + e.w / 2 >= WIDTH - 8 || e.x - e.w / 2 <= 8);
  if (hitsEdge) {
    direction = direction === 1 ? -1 : 1;
    enemies = enemies.map((e) => ({ ...e, x: e.x + direction * speed * dt, y: e.y + 16 }));
  }

  // Shots hit enemies: both go, and the score goes up by the enemy's row.
  const spent = new Set<Box>();
  enemies = enemies.filter((enemy) => {
    const shot = shots.find((s) => !spent.has(s) && overlaps(s, enemy));
    if (!shot) return true;
    spent.add(shot);
    score += POINTS[enemy.row] ?? 10;
    return false;
  });
  shots = shots.filter((s) => !spent.has(s));

  // Enemies at the bottom of each column drop bombs, now and then.
  let bombs = world.bombs.map((b) => ({ ...b, y: b.y + BOMB_SPEED * dt })).filter((b) => b.y < HEIGHT + b.h);
  const roll = random(seed);
  seed = roll.seed;
  if (enemies.length && roll.value < 0.02 + world.wave * 0.004) {
    const pick = random(seed);
    seed = pick.seed;
    const shooter = enemies[Math.floor(pick.value * enemies.length)];
    const lowest = enemies.filter((e) => Math.abs(e.x - shooter.x) < 4).reduce((a, b) => (b.y > a.y ? b : a));
    bombs.push({ x: lowest.x, y: lowest.y + lowest.h / 2 + 6, w: 4, h: 12 });
  }

  // Bombs hit the player: a life lost, and a moment of shield so one volley can't take them all.
  let status: World["status"] = "playing";
  if (player.shield === 0 && bombs.some((b) => overlaps(b, player))) {
    player.lives -= 1;
    player.shield = SHIELD;
    bombs = bombs.filter((b) => !overlaps(b, player));
    if (player.lives <= 0) status = "over";
  }
  // The formation reaching the player's row ends the game, lives or not.
  if (enemies.some((e) => e.y + e.h / 2 >= player.y - player.h / 2)) status = "over";

  // A cleared wave: the next one, a little faster and a little lower.
  let wave = world.wave;
  if (enemies.length === 0 && status === "playing") {
    wave += 1;
    enemies = formation(wave);
    bombs = [];
    direction = 1;
  }
  return { player, shots, bombs, enemies, direction, score, wave, status, seed, time: world.time + dt };
}

// Screens refresh at 30, 60 or 144 frames a second: the game always moves in 1/60 s steps. This runs
// as many whole steps as fit in the time since the last frame, and carries the rest over.
export function advance(world: World, keys: Keys, elapsed: number, carry: number): { world: World; carry: number; steps: number } {
  let time = carry + Math.min(elapsed, 0.25); // after a long pause, don't try to catch up on minutes
  let steps = 0;
  while (time >= STEP - 1e-9) {
    world = update(world, keys);
    time -= STEP;
    steps++;
  }
  return { world, carry: time, steps };
}
