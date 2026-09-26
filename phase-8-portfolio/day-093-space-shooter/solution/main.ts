import { advance, HEIGHT, newWorld, random, WIDTH, type Keys, type World } from "./engine.ts";

// The page: draws the world, and turns keys and touches into Keys. The game itself is in engine.ts.
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>("canvas");
const ctx = canvas.getContext("2d")!;
const keys: Keys = { left: false, right: false, fire: false };
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const ROW_COLOURS = ["#f472b6", "#a78bfa", "#a78bfa", "#34d399", "#34d399"];

let world: World = newWorld(Date.now() % 100000);
let running = false;
let carry = 0;
let last = 0;
let best = 0;
try {
  best = Number(localStorage.getItem("space-best") ?? 0);
} catch {
  /* no storage */
}

// A starfield that drifts (unless reduced motion is on).
let starSeed = 7;
const stars = Array.from({ length: 70 }, () => {
  const a = random(starSeed);
  const b = random(a.seed);
  const c = random(b.seed);
  starSeed = c.seed;
  return { x: a.value * WIDTH, y: b.value * HEIGHT, z: 0.3 + c.value * 0.7 };
});

function drawShip(x: number, y: number, blink: boolean): void {
  if (blink) return;
  ctx.fillStyle = "#22d3ee";
  ctx.beginPath();
  ctx.moveTo(x, y - 14);
  ctx.lineTo(x + 20, y + 12);
  ctx.lineTo(x + 6, y + 6);
  ctx.lineTo(x - 6, y + 6);
  ctx.lineTo(x - 20, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f472b6";
  ctx.fillRect(x - 3, y + 6, 6, 5); // the engine
}

function drawAlien(x: number, y: number, colour: string, frame: number): void {
  ctx.fillStyle = colour;
  const px = 4;
  // An 8 × 6 pixel alien, two frames of legs.
  const body = ["..X..X..", ".XXXXXX.", "XX.XX.XX", "XXXXXXXX", frame ? ".X....X." : "X.X..X.X", frame ? "X......X" : ".X....X."];
  body.forEach((line, r) => [...line].forEach((ch, c) => ch === "X" && ctx.fillRect(x - 16 + c * px, y - 12 + r * px, px, px)));
}

function draw(): void {
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  for (const s of stars) {
    const y = reducedMotion ? s.y : (s.y + world.time * 30 * s.z) % HEIGHT;
    ctx.fillStyle = `rgb(226 232 240 / ${s.z * 0.8})`;
    ctx.fillRect(s.x, y, s.z * 2, s.z * 2);
  }
  // The city on the horizon.
  ctx.fillStyle = "#0b1226";
  for (let x = 0, i = 0; x < WIDTH; x += 24, i++) ctx.fillRect(x, HEIGHT - 18 - ((i * 37) % 26), 22, 60);
  const frame = Math.floor(world.time * 2) % 2;
  for (const e of world.enemies) drawAlien(e.x, e.y, ROW_COLOURS[e.row], frame);
  ctx.fillStyle = "#facc15";
  for (const s of world.shots) ctx.fillRect(s.x - s.w / 2, s.y - s.h / 2, s.w, s.h);
  ctx.fillStyle = "#fb7185";
  for (const b of world.bombs) ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
  const p = world.player;
  drawShip(p.x, p.y, p.shield > 0 && Math.floor(world.time * 10) % 2 === 0);
}

function hud(): void {
  $("score").textContent = String(world.score);
  $("wave").textContent = String(world.wave);
  $("lives").textContent = "▲".repeat(Math.max(0, world.player.lives));
  $("lives").setAttribute("aria-label", `${world.player.lives} lives`);
  $("best").textContent = String(Math.max(best, world.score));
}

function showOverlay(title: string, message: string, button: string): void {
  $("title").textContent = title;
  $("message").textContent = message;
  $("start").textContent = button;
  $("overlay").hidden = false;
  $("start").focus();
  $("announce").textContent = `${title}. ${message}`;
}

function frame(now: number): void {
  if (!running) return;
  const wave = world.wave;
  const lives = world.player.lives;
  ({ world, carry } = advance(world, keys, (now - last) / 1000, carry));
  last = now;
  if (world.wave !== wave) $("announce").textContent = `Wave ${world.wave}`;
  if (world.player.lives < lives && world.player.lives > 0) $("announce").textContent = `Hit! ${world.player.lives} lives left`;
  draw();
  hud();
  if (world.status === "over") {
    running = false;
    const record = world.score > best;
    best = Math.max(best, world.score);
    try {
      localStorage.setItem("space-best", String(best));
    } catch {
      /* no storage */
    }
    return showOverlay("Game over", `${world.score} points, wave ${world.wave}.${record ? " A new best!" : ""}`, "Play again");
  }
  requestAnimationFrame(frame);
}

function start(): void {
  if (world.status === "over") world = newWorld(Date.now() % 100000);
  $("overlay").hidden = true;
  running = true;
  carry = 0;
  last = performance.now();
  canvas.focus();
  requestAnimationFrame(frame);
}

function pause(): void {
  if (!running) return;
  running = false;
  showOverlay("Paused", "Take a breather.", "Resume");
}

const KEY_MAP: Record<string, keyof Keys> = { ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right", " ": "fire", ArrowUp: "fire" };
addEventListener("keydown", (e) => {
  if (e.key === "p" || e.key === "P" || e.key === "Escape") return running ? pause() : undefined;
  const key = KEY_MAP[e.key];
  if (!key || !running) return;
  e.preventDefault();
  keys[key] = true;
});
addEventListener("keyup", (e) => {
  const key = KEY_MAP[e.key];
  if (key) keys[key] = false;
});
addEventListener("blur", pause); // switching apps pauses, and no key gets stuck down
document.addEventListener("visibilitychange", () => document.hidden && pause());
document.querySelectorAll<HTMLButtonElement>(".touch button").forEach((button) => {
  const key = button.dataset.key as keyof Keys;
  button.addEventListener("pointerdown", (e) => ((keys[key] = true), button.setPointerCapture(e.pointerId)));
  for (const type of ["pointerup", "pointercancel"]) button.addEventListener(type, () => (keys[key] = false));
});
$("start").addEventListener("click", start);

draw();
hud();
