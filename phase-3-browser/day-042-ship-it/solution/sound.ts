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
  let audio: AudioOut | undefined;
  let isMuted = muted;

  function playTone(out: AudioOut, tone: Tone, at: number): void {
    const oscillator = out.createOscillator();
    oscillator.type = tone.wave;
    oscillator.frequency.setValueAtTime(tone.frequency, at);
    const gain = out.createGain();
    gain.gain.setValueAtTime(tone.volume, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + tone.duration); // fade out: no click at the end
    oscillator.connect(gain).connect(out.destination);
    oscillator.start(at);
    oscillator.stop(at + tone.duration);
  }

  return {
    play(event) {
      if (isMuted) return;
      audio ??= openAudio();
      let at = audio.currentTime;
      for (const tone of SOUNDS[event]) {
        playTone(audio, tone, at);
        at += tone.duration;
      }
    },
    get muted() {
      return isMuted;
    },
    setMuted(value) {
      isMuted = value;
    },
  };
}

export function loadMuted(storage: Pick<Storage, "getItem">, key: string): boolean {
  try {
    return storage.getItem(key) === "true";
  } catch {
    return false;
  }
}

export function saveMuted(storage: Pick<Storage, "setItem">, key: string, muted: boolean): void {
  try {
    storage.setItem(key, String(muted));
  } catch {
    // Not being able to remember the setting is fine; the game still works.
  }
}
