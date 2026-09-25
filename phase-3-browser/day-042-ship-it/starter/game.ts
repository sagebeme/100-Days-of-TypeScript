// Sizes are in canvas pixels, times in seconds, speeds in pixels per second.
export const WIDTH = 300;
export const HEIGHT = 500;
export const LANES = 3;
export const LANE_WIDTH = WIDTH / LANES;
export const RIDER_Y = 400;
export const RIDER_WIDTH = 40;
export const RIDER_HEIGHT = 70;
export const CAR_WIDTH = 60;
export const CAR_HEIGHT = 90;
export const BASE_SPEED = 240;
export const SPAWN_EVERY = 1.2;
export const FIXED_DT = 1 / 60;
export const MAX_FRAME = 0.25;

export const LEVEL_EVERY = 3000; // pixels of distance (300 m) per level
export const SPEED_PER_LEVEL = 40;
export const SPAWN_FASTER_PER_LEVEL = 0.1;
export const MIN_SPAWN_EVERY = 0.5;

export interface Car {
  lane: number;
  y: number; // the top of the car
}

// New today: the game waits on a start screen, and can be paused.
export type Status = "ready" | "running" | "paused" | "over";

export interface GameState {
  lane: number;
  distance: number;
  speed: number;
  traffic: Car[];
  spawnIn: number;
  status: Status;
  score: number; // cars dodged
  level: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Direction = "left" | "right";

// Things that happen during an update, for sounds and screen-reader announcements.
export type GameEvent = "dodge" | "levelUp" | "crash";

export type Pen = Pick<
  CanvasRenderingContext2D,
  "fillStyle" | "fillRect" | "font" | "fillText" | "textAlign" | "beginPath" | "roundRect" | "arc" | "fill"
>;

export interface RenderOptions {
  reducedMotion: boolean;
}

const DASH_LENGTH = 24;
const DASH_GAP = 24;

const COLORS = {
  road: "#23262e",
  shoulder: "#15171c",
  edgeLine: "#e9c46a",
  laneLine: "rgba(255, 255, 255, 0.55)",
  car: "#e76f51",
  carRoof: "#f4a261",
  window: "rgba(20, 24, 33, 0.85)",
  rider: "#2a9d8f",
  box: "#e9c46a",
  helmet: "#f8f9fa",
  text: "#f8f9fa",
  shade: "rgba(10, 12, 16, 0.72)",
};

export function laneCenter(lane: number): number {
  return lane * LANE_WIDTH + LANE_WIDTH / 2;
}

export function createGame(): GameState {
  return {
    lane: 1,
    distance: 0,
    speed: BASE_SPEED,
    traffic: [],
    spawnIn: SPAWN_EVERY,
    status: "ready",
    score: 0,
    level: 1,
  };
}

export function start(state: GameState): GameState {
  if (state.status === "ready") return { ...state, status: "running" };
  if (state.status === "over") return { ...createGame(), status: "running" };
  return state;
}

export function togglePause(state: GameState): GameState {
  if (state.status === "running") return { ...state, status: "paused" };
  if (state.status === "paused") return { ...state, status: "running" };
  return state;
}

export function steer(state: GameState, direction: Direction): GameState {
  if (state.status !== "running") {
    return state;
  }
  const lane = direction === "left" ? state.lane - 1 : state.lane + 1;
  return { ...state, lane: Math.min(Math.max(lane, 0), LANES - 1) };
}

export function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

export function riderBox(state: GameState): Box {
  return { x: laneCenter(state.lane) - RIDER_WIDTH / 2, y: RIDER_Y, width: RIDER_WIDTH, height: RIDER_HEIGHT };
}

export function carBox(car: Car): Box {
  return { x: laneCenter(car.lane) - CAR_WIDTH / 2, y: car.y, width: CAR_WIDTH, height: CAR_HEIGHT };
}

export function levelFor(distance: number): number {
  return 1 + Math.floor(distance / LEVEL_EVERY);
}

export function speedFor(level: number): number {
  return BASE_SPEED + (level - 1) * SPEED_PER_LEVEL;
}

export function spawnEveryFor(level: number): number {
  return Math.max(MIN_SPAWN_EVERY, SPAWN_EVERY - (level - 1) * SPAWN_FASTER_PER_LEVEL);
}

export function update(state: GameState, dt: number, random: () => number): GameState {
  if (state.status !== "running") {
    return state;
  }

  const moved = state.speed * dt;
  const distance = state.distance + moved;
  const movedCars = state.traffic.map((car) => ({ ...car, y: car.y + moved }));
  let traffic = movedCars.filter((car) => car.y < HEIGHT);
  const score = state.score + (movedCars.length - traffic.length);

  let spawnIn = state.spawnIn - dt;
  if (spawnIn <= 0) {
    traffic = [...traffic, { lane: Math.floor(random() * LANES), y: -CAR_HEIGHT }];
    spawnIn += spawnEveryFor(state.level);
  }

  const level = levelFor(distance);
  const next: GameState = { ...state, distance, traffic, spawnIn, score, level, speed: speedFor(level) };

  const rider = riderBox(next);
  if (traffic.some((car) => overlaps(rider, carBox(car)))) {
    return { ...next, status: "over" };
  }
  return next;
}

export function eventsBetween(before: GameState, after: GameState): GameEvent[] {
  const events: GameEvent[] = [];
  if (after.score > before.score) events.push("dodge");
  if (after.level > before.level) events.push("levelUp");
  if (before.status !== "over" && after.status === "over") events.push("crash");
  return events;
}

export function stepLoop(
  accumulator: number,
  frameSeconds: number,
  step: number = FIXED_DT,
): { steps: number; accumulator: number } {
  let left = accumulator + Math.min(frameSeconds, MAX_FRAME);
  let steps = 0;
  while (left >= step) {
    left -= step;
    steps++;
  }
  return { steps, accumulator: left };
}

export function formatDistance(distance: number): string {
  return `${Math.floor(distance / 10)} m`;
}

export function loadBest(storage: Pick<Storage, "getItem">, key: string): number {
  try {
    const best = Number(storage.getItem(key));
    return Number.isInteger(best) && best > 0 ? best : 0;
  } catch {
    return 0;
  }
}

export function saveBest(storage: Pick<Storage, "setItem">, key: string, best: number): boolean {
  try {
    storage.setItem(key, String(best));
    return true;
  } catch {
    return false;
  }
}

// The words on the canvas for each screen. Running has none.
export function overlayText(state: GameState): { title: string; hint: string } | null {
  switch (state.status) {
    case "ready":
      return { title: "Rider Rush", hint: "Press Space or tap Start" };
    case "paused":
      return { title: "Paused", hint: "Press P or tap Resume" };
    case "over":
      return { title: "Crashed!", hint: "Press Space to ride again" };
    case "running":
      return null;
  }
}

function drawCar(pen: Pen, car: Car): void {
  const box = carBox(car);
  pen.fillStyle = COLORS.car;
  pen.beginPath();
  pen.roundRect(box.x, box.y, box.width, box.height, 10);
  pen.fill();
  pen.fillStyle = COLORS.carRoof;
  pen.beginPath();
  pen.roundRect(box.x + 8, box.y + 26, box.width - 16, 36, 6);
  pen.fill();
  pen.fillStyle = COLORS.window;
  pen.fillRect(box.x + 10, box.y + 62, box.width - 20, 12); // rear window, facing the rider
}

function drawRider(pen: Pen, state: GameState): void {
  const box = riderBox(state);
  const middle = box.x + box.width / 2;
  pen.fillStyle = COLORS.rider;
  pen.beginPath();
  pen.roundRect(middle - 9, box.y + 8, 18, box.height - 8, 8); // the motorbike
  pen.fill();
  pen.fillStyle = COLORS.box;
  pen.beginPath();
  pen.roundRect(box.x + 4, box.y + 36, box.width - 8, 26, 4); // the delivery box
  pen.fill();
  pen.fillStyle = COLORS.helmet;
  pen.beginPath();
  pen.arc(middle, box.y + 18, 9, 0, Math.PI * 2);
  pen.fill();
}

export function render(pen: Pen, state: GameState, options: RenderOptions): void {
  pen.fillStyle = COLORS.road;
  pen.fillRect(0, 0, WIDTH, HEIGHT);

  // Road edges
  pen.fillStyle = COLORS.shoulder;
  pen.fillRect(0, 0, 6, HEIGHT);
  pen.fillRect(WIDTH - 6, 0, 6, HEIGHT);
  pen.fillStyle = COLORS.edgeLine;
  pen.fillRect(6, 0, 3, HEIGHT);
  pen.fillRect(WIDTH - 9, 0, 3, HEIGHT);

  // Lane markings slide with the distance, unless motion is reduced
  const spacing = DASH_LENGTH + DASH_GAP;
  const offset = options.reducedMotion ? 0 : state.distance % spacing;
  pen.fillStyle = COLORS.laneLine;
  for (let lane = 1; lane < LANES; lane++) {
    const x = lane * LANE_WIDTH - 2;
    for (let y = offset - spacing; y < HEIGHT; y += spacing) {
      pen.fillRect(x, y, 4, DASH_LENGTH);
    }
  }

  for (const car of state.traffic) drawCar(pen, car);
  drawRider(pen, state);

  pen.fillStyle = COLORS.text;
  pen.font = "600 16px system-ui, sans-serif";
  pen.textAlign = "left";
  pen.fillText(`Level ${state.level}`, 16, 28);

  const overlay = overlayText(state);
  if (overlay !== null) {
    pen.fillStyle = COLORS.shade;
    pen.fillRect(0, 0, WIDTH, HEIGHT);
    pen.fillStyle = COLORS.text;
    pen.textAlign = "center";
    pen.font = "700 32px system-ui, sans-serif";
    pen.fillText(overlay.title, WIDTH / 2, HEIGHT / 2 - 8);
    pen.font = "500 15px system-ui, sans-serif";
    pen.fillText(overlay.hint, WIDTH / 2, HEIGHT / 2 + 24);
  }
}
