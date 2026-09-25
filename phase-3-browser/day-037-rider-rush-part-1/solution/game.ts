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

export interface Car {
  lane: number;
  y: number; // the top of the car
}

export interface GameState {
  lane: number;
  distance: number;
  speed: number;
  traffic: Car[];
  spawnIn: number;
}

export type Direction = "left" | "right";

// The drawing methods render() uses. A real canvas context fits, and so does a test fake.
export type Pen = Pick<CanvasRenderingContext2D, "fillStyle" | "fillRect" | "font" | "fillText">;

const DASH_LENGTH = 24;
const DASH_GAP = 24;

export function laneCenter(lane: number): number {
  return lane * LANE_WIDTH + LANE_WIDTH / 2;
}

export function createGame(): GameState {
  return { lane: 1, distance: 0, speed: BASE_SPEED, traffic: [], spawnIn: SPAWN_EVERY };
}

export function steer(state: GameState, direction: Direction): GameState {
  const lane = direction === "left" ? state.lane - 1 : state.lane + 1;
  return { ...state, lane: Math.min(Math.max(lane, 0), LANES - 1) };
}

export function update(state: GameState, dt: number, random: () => number): GameState {
  const moved = state.speed * dt;
  let traffic = state.traffic.map((car) => ({ ...car, y: car.y + moved })).filter((car) => car.y < HEIGHT);
  let spawnIn = state.spawnIn - dt;
  if (spawnIn <= 0) {
    traffic = [...traffic, { lane: Math.floor(random() * LANES), y: -CAR_HEIGHT }];
    spawnIn += SPAWN_EVERY;
  }
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
  pen.fillText(formatDistance(state.distance), 10, 26);
}
