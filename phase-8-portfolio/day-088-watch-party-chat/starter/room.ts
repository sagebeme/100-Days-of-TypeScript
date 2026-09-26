import type { ChatLine, Playback } from "./protocol.ts";

// A watch-party room, with no sockets. The tests are the spec.
export const HISTORY = 50;
export const MAX_TEXT = 500;
export const RATE = { messages: 5, perMs: 5_000 };

export class Room {
  readonly name: string;
  readonly people = new Map<string, number[]>(); // name -> times of their recent messages
  readonly history: ChatLine[] = [];
  playback: Playback = { playing: false, position: 0, updatedAt: 0, by: null };

  constructor(name: string) {
    this.name = name;
  }

  join(wanted: string): string {
    throw new Error(`TODO: join(${wanted})`);
  }

  leave(name: string): void {
    throw new Error(`TODO: leave(${name})`);
  }

  get names(): string[] {
    throw new Error("TODO: names");
  }

  chat(from: string, raw: string, now: number): ChatLine | { error: string } {
    throw new Error(`TODO: chat(${from}, ${raw}, ${now})`);
  }

  react(from: string, emoji: string): { from: string; emoji: string } | { error: string } {
    throw new Error(`TODO: react(${from}, ${emoji})`);
  }

  control(by: string, action: "play" | "pause" | "seek", position: number, now: number): Playback | { error: string } {
    throw new Error(`TODO: control(${by}, ${action}, ${position}, ${now})`);
  }
}

export function positionAt(playback: Playback, now: number): number {
  throw new Error(`TODO: positionAt(${playback.position}, ${now})`);
}

export function cleanName(name: string): string {
  throw new Error(`TODO: cleanName(${name})`);
}

export function cleanText(text: string): string {
  throw new Error(`TODO: cleanText(${text})`);
}

export function formatPosition(seconds: number): string {
  throw new Error(`TODO: formatPosition(${seconds})`);
}
