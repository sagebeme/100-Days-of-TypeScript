import type { GameEvent } from "./game.ts";

export interface Tone {
  frequency: number; // Hz
  duration: number; // seconds
  wave: OscillatorType;
  volume: number; // 0 to 1; keep these small, browsers play sound loud
}

// Each event is a short run of tones, played one after the other.
export const SOUNDS: Record<GameEvent, Tone[]> = {
  dodge: [{ frequency: 880, duration: 0.05, wave: "square", volume: 0.04 }],
  levelUp: [
    { frequency: 523, duration: 0.09, wave: "triangle", volume: 0.12 },
    { frequency: 659, duration: 0.09, wave: "triangle", volume: 0.12 },
    { frequency: 784, duration: 0.16, wave: "triangle", volume: 0.12 },
  ],
  crash: [
    { frequency: 220, duration: 0.12, wave: "sawtooth", volume: 0.1 },
    { frequency: 110, duration: 0.3, wave: "sawtooth", volume: 0.1 },
  ],
};

// The parts of an AudioContext the sounds use. A real AudioContext fits, and so does a test fake.
export type AudioOut = Pick<AudioContext, "currentTime" | "destination" | "createOscillator" | "createGain">;

export interface Sfx {
  play(event: GameEvent): void;
  readonly muted: boolean;
  setMuted(muted: boolean): void;
}

// Browsers only allow sound after the player has tapped or pressed something, so the
// AudioContext isn't created until the first sound that isn't muted.
export function createSfx(openAudio: () => AudioOut, muted: boolean): Sfx {
  // TODO: keep `audio` (undefined until the first sound) and `isMuted` in variables

  // TODO: playTone(out, tone, at): an oscillator (type = tone.wave, frequency set at `at`)
  //   into a gain node (volume at `at`, exponentialRampToValueAtTime(0.0001, at + duration))
  //   into out.destination; start at `at`, stop at `at + duration`

  // TODO: return { play, muted (a getter), setMuted }. play(event): do nothing if muted;
  //   otherwise open the audio the first time (audio ??= openAudio()), then play each tone
  //   of SOUNDS[event] one after the other, starting at audio.currentTime
  throw new Error("not implemented yet");
}

export function loadMuted(storage: Pick<Storage, "getItem">, key: string): boolean {
  // TODO: true only if the stored value is exactly "true"; false if it's anything else or getItem throws
  throw new Error("not implemented yet");
}

export function saveMuted(storage: Pick<Storage, "setItem">, key: string, muted: boolean): void {
  // TODO: store "true" or "false"; if setItem throws, carry on quietly
  throw new Error("not implemented yet");
}
