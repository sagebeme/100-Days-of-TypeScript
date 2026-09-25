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

// New today: levels.
export const LEVEL_EVERY = 3000; // pixels of distance (300 m) per level
export const SPEED_PER_LEVEL = 40;
export const SPAWN_FASTER_PER_LEVEL = 0.1;
export const MIN_SPAWN_EVERY = 0.5;

export interface Car {
  lane: number;
  y: number; // the top of the car
}

export type Status = "running" | "over";

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

// The drawing methods render() uses. A real canvas context fits, and so does a test fake.
export type Pen = Pick<CanvasRenderingContext2D, "fillStyle" | "fillRect" | "font" | "fillText" | "textAlign">;

const DASH_LENGTH = 24;
const DASH_GAP = 24;

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
    status: "running",
    score: 0,
    level: 1,
  };
}

export function steer(state: GameState, direction: Direction): GameState {
  if (state.status === "over") {
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
  if (state.status === "over") {
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

export function render(pen: Pen, state: GameState): void {
  pen.fillStyle = "#3b3b3b";
  pen.fillRect(0, 0, WIDTH, HEIGHT);

  const spacing = DASH_LENGTH + DASH_GAP;
  const offset = state.distance % spacing;
  pen.fillStyle = "#f1f1f1";
  for (let lane = 1; lane < LANES; lane++) {
    const x = lane * LANE_WIDTH - 2;
    for (let y = offset - spacing; y < HEIGHT; y += spacing) {
      pen.fillRect(x, y, 4, DASH_LENGTH);
    }
  }

  pen.fillStyle = "#e63946";
  for (const car of state.traffic) {
    const box = carBox(car);
    pen.fillRect(box.x, box.y, box.width, box.height);
  }

  const rider = riderBox(state);
  pen.fillStyle = "#ffd166";
  pen.fillRect(rider.x, rider.y, rider.width, rider.height);

  pen.fillStyle = "#ffffff";
  pen.font = "bold 18px system-ui, sans-serif";
  pen.textAlign = "left";
  pen.fillText(formatDistance(state.distance), 10, 26);
  pen.fillText(`Level ${state.level}`, 10, 50);
  pen.textAlign = "right";
  pen.fillText(`Score ${state.score}`, WIDTH - 10, 26);

  if (state.status === "over") {
    pen.fillStyle = "rgba(0, 0, 0, 0.6)";
    pen.fillRect(0, 0, WIDTH, HEIGHT);
    pen.fillStyle = "#ffffff";
    pen.font = "bold 32px system-ui, sans-serif";
    pen.textAlign = "center";
    pen.fillText("Crashed!", WIDTH / 2, HEIGHT / 2);
  }
}
