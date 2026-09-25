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
  return Object.hasOwn(KEYS, key) ? KEYS[key] : null;
}

export interface PointerMove {
  dx: number; // how far the pointer moved sideways between down and up
  dy: number;
  x: number; // where it was let go, from the left of the canvas
  width: number; // the canvas's width on screen
}

// A sideways swipe steers that way. A tap steers towards the side of the road you tapped.
export function steerFromPointer(move: PointerMove): Direction | null {
  if (Math.abs(move.dx) >= SWIPE_DISTANCE && Math.abs(move.dx) > Math.abs(move.dy)) {
    return move.dx < 0 ? "left" : "right";
  }
  if (Math.abs(move.dx) < SWIPE_DISTANCE && Math.abs(move.dy) < SWIPE_DISTANCE && move.width > 0) {
    return move.x < move.width / 2 ? "left" : "right";
  }
  return null;
}

// What a screen reader hears. Dodges happen every second or so, which would be far too chatty.
// `bestBefore` is the best score from before this ride, so a tie isn't called a new best.
export function announcementFor(event: GameEvent, state: GameState, bestBefore: number): string | null {
  switch (event) {
    case "levelUp":
      return `Level ${state.level}. Traffic is faster.`;
    case "crash":
      return state.score > bestBefore
        ? `Crashed. New best score: ${state.score}.`
        : `Crashed. Score ${state.score}. Best ${bestBefore}.`;
    case "dodge":
      return null;
  }
}
