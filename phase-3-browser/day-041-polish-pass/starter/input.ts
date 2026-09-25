import type { Direction, GameEvent, GameState } from "./game.ts";

export const SWIPE_DISTANCE = 30; // px a pointer must travel sideways to count as a swipe

export type Command = "steerLeft" | "steerRight" | "start" | "pause" | "mute";

// One table for the keyboard, so the help text and the code can't disagree.
export const KEYS: Record<string, Command> = {
  ArrowLeft: "steerLeft",
  a: "steerLeft",
  A: "steerLeft",
  ArrowRight: "steerRight",
  d: "steerRight",
  D: "steerRight",
  " ": "start",
  Enter: "start",
  p: "pause",
  P: "pause",
  Escape: "pause",
  m: "mute",
  M: "mute",
};

export function commandForKey(key: string): Command | null {
  // TODO: the command for this key from KEYS, or null. Careful: KEYS["toString"] exists on every
  //   object, so check with Object.hasOwn(KEYS, key) first.
  throw new Error("not implemented yet");
}

export interface PointerMove {
  dx: number; // how far the pointer moved sideways between down and up
  dy: number;
  x: number; // where it was let go, from the left of the canvas
  width: number; // the canvas's width on screen
}

// A sideways swipe steers that way. A tap steers towards the side of the road you tapped.
export function steerFromPointer(move: PointerMove): Direction | null {
  // TODO: a swipe: moved at least SWIPE_DISTANCE sideways, and more sideways than up/down -> that way
  // TODO: a tap: moved less than SWIPE_DISTANCE both ways (and width > 0) -> the half of the canvas tapped
  // TODO: anything else (like a swipe up) -> null
  throw new Error("not implemented yet");
}

// What a screen reader hears. Dodges happen every second or so, which would be far too chatty.
// `bestBefore` is the best score from before this ride, so a tie isn't called a new best.
export function announcementFor(event: GameEvent, state: GameState, bestBefore: number): string | null {
  // TODO: levelUp -> "Level 3. Traffic is faster."
  // TODO: crash   -> "Crashed. New best score: 12." if the score beat bestBefore,
  //                  otherwise "Crashed. Score 7. Best 12."
  // TODO: dodge   -> null
  throw new Error("not implemented yet");
}
