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

export function laneCenter(lane: number): number {
  // TODO: the x of the middle of the lane
  throw new Error("not implemented yet");
}

export function createGame(): GameState {
  // TODO: lane 1, distance 0, BASE_SPEED, no traffic, spawnIn SPAWN_EVERY
  throw new Error("not implemented yet");
}

export function steer(state: GameState, direction: Direction): GameState {
  // TODO: one lane left or right, clamped to 0 .. LANES - 1
  throw new Error("not implemented yet");
}

export function update(state: GameState, dt: number, random: () => number): GameState {
  // TODO: distance += speed * dt
  // TODO: every car moves down speed * dt; drop cars whose y has reached HEIGHT
  // TODO: spawnIn -= dt; at 0 or below add { lane: Math.floor(random() * LANES), y: -CAR_HEIGHT }
  //       and add SPAWN_EVERY back to spawnIn
  throw new Error("not implemented yet");
}

export function stepLoop(
  accumulator: number,
  frameSeconds: number,
  step: number = FIXED_DT,
): { steps: number; accumulator: number } {
  // TODO: add min(frameSeconds, MAX_FRAME), then take out whole steps
  throw new Error("not implemented yet");
}

export function formatDistance(distance: number): string {
  // TODO: 10 px = 1 m, whole metres: 1234 -> "123 m"
  throw new Error("not implemented yet");
}

export function render(pen: Pen, state: GameState): void {
  // TODO: the road (fill the whole canvas first)
  // TODO: dashed lane lines between lanes, shifted down by (distance % dash spacing) so they scroll
  // TODO: each car: fillRect(laneCenter(lane) - CAR_WIDTH / 2, y, CAR_WIDTH, CAR_HEIGHT)
  // TODO: the rider: fillRect(laneCenter(lane) - RIDER_WIDTH / 2, RIDER_Y, RIDER_WIDTH, RIDER_HEIGHT)
  // TODO: the distance with fillText in the top-left corner
  throw new Error("not implemented yet");
}
