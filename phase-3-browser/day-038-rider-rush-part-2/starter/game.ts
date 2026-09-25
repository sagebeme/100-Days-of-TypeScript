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
  // TODO: once the game is over, steering does nothing
  const lane = direction === "left" ? state.lane - 1 : state.lane + 1;
  return { ...state, lane: Math.min(Math.max(lane, 0), LANES - 1) };
}

export function overlaps(a: Box, b: Box): boolean {
  // TODO: true if the boxes overlap. Boxes that only touch along an edge do NOT overlap.
  throw new Error("not implemented yet");
}

export function riderBox(state: GameState): Box {
  // TODO: the rider's rectangle (the same one render() draws)
  throw new Error("not implemented yet");
}

export function carBox(car: Car): Box {
  // TODO: the car's rectangle (the same one render() draws)
  throw new Error("not implemented yet");
}

export function levelFor(distance: number): number {
  // TODO: level 1 to start, one more every LEVEL_EVERY pixels
  throw new Error("not implemented yet");
}

export function speedFor(level: number): number {
  // TODO: BASE_SPEED, plus SPEED_PER_LEVEL for every level above 1
  throw new Error("not implemented yet");
}

export function spawnEveryFor(level: number): number {
  // TODO: SPAWN_EVERY, minus SPAWN_FASTER_PER_LEVEL for every level above 1, never below MIN_SPAWN_EVERY
  throw new Error("not implemented yet");
}

// Part 1's update(). Today it grows: see the TODOs.
export function update(state: GameState, dt: number, random: () => number): GameState {
  // TODO: once the game is over, nothing moves: return the state unchanged

  const moved = state.speed * dt;
  let traffic = state.traffic.map((car) => ({ ...car, y: car.y + moved })).filter((car) => car.y < HEIGHT);
  // TODO: every car that just left the bottom of the screen was dodged: add 1 to the score for each

  let spawnIn = state.spawnIn - dt;
  if (spawnIn <= 0) {
    traffic = [...traffic, { lane: Math.floor(random() * LANES), y: -CAR_HEIGHT }];
    // TODO: use spawnEveryFor(state.level) instead, so cars come more often on higher levels
    spawnIn += SPAWN_EVERY;
  }

  // TODO: work out the level from the new distance, and set the speed for that level
  // TODO: if any car's box overlaps the rider's box, the status becomes "over"
  return { ...state, distance: state.distance + moved, traffic, spawnIn };
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
  // TODO: the saved best score, or 0 if it's missing, not a whole number above 0, or getItem throws
  throw new Error("not implemented yet");
}

export function saveBest(storage: Pick<Storage, "setItem">, key: string, best: number): boolean {
  // TODO: save it as a string and return true; if setItem throws, return false
  throw new Error("not implemented yet");
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
    pen.fillRect(laneCenter(car.lane) - CAR_WIDTH / 2, car.y, CAR_WIDTH, CAR_HEIGHT);
  }

  pen.fillStyle = "#ffd166";
  pen.fillRect(laneCenter(state.lane) - RIDER_WIDTH / 2, RIDER_Y, RIDER_WIDTH, RIDER_HEIGHT);

  pen.fillStyle = "#ffffff";
  pen.font = "bold 18px system-ui, sans-serif";
  pen.textAlign = "left";
  pen.fillText(formatDistance(state.distance), 10, 26);
  // TODO: "Level 2" under the distance, and "Score 7" in the top-right corner
  // TODO: when the game is over, darken the whole road and write "Crashed!" in the middle
}
