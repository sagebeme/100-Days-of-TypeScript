import { REACTIONS, type ChatLine, type Playback } from "./protocol.ts";

// A watch-party room, with no sockets: who's here, what's been said, and where the stream is. The
// server turns socket messages into calls here and sends back what they return.
export const HISTORY = 50; // lines a newcomer sees
export const MAX_TEXT = 500;
export const RATE = { messages: 5, perMs: 5_000 }; // chat messages per person

export class Room {
  readonly name: string;
  readonly people = new Map<string, number[]>(); // name -> times of their recent messages
  readonly history: ChatLine[] = [];
  playback: Playback = { playing: false, position: 0, updatedAt: 0, by: null };
  #nextId = 1;

  constructor(name: string) {
    this.name = name;
  }

  // Two people can't share a name in one room: the second "Amina" becomes "Amina 2".
  join(wanted: string): string {
    const base = cleanName(wanted);
    let name = base;
    for (let n = 2; this.people.has(name); n++) name = `${base} ${n}`;
    this.people.set(name, []);
    return name;
  }

  leave(name: string): void {
    this.people.delete(name);
  }

  get names(): string[] {
    return [...this.people.keys()].sort((a, b) => a.localeCompare(b));
  }

  // A chat line, or the reason it wasn't sent.
  chat(from: string, raw: string, now: number): ChatLine | { error: string } {
    const recent = this.people.get(from);
    if (!recent) return { error: "Join the room first" };
    const text = cleanText(raw);
    if (!text) return { error: "Say something first" };
    if (text.length > MAX_TEXT) return { error: `Keep it under ${MAX_TEXT} characters` };
    const window = recent.filter((t) => now - t < RATE.perMs);
    if (window.length >= RATE.messages) return { error: "Slow down a little" };
    this.people.set(from, [...window, now]);
    const line: ChatLine = { id: this.#nextId++, from, text, at: now };
    this.history.push(line);
    if (this.history.length > HISTORY) this.history.splice(0, this.history.length - HISTORY);
    return line;
  }

  react(from: string, emoji: string): { from: string; emoji: string } | { error: string } {
    if (!this.people.has(from)) return { error: "Join the room first" };
    if (!(REACTIONS as readonly string[]).includes(emoji)) return { error: "That reaction isn't available" };
    return { from, emoji };
  }

  // Everyone presses play, pause and seek on the same stream. The server keeps where it was and when,
  // so anyone can work out where it is now.
  control(by: string, action: "play" | "pause" | "seek", position: number, now: number): Playback | { error: string } {
    if (!this.people.has(by)) return { error: "Join the room first" };
    if (!Number.isFinite(position) || position < 0) return { error: "That isn't a place in the stream" };
    const playing = action === "play" ? true : action === "pause" ? false : this.playback.playing;
    this.playback = { playing, position, updatedAt: now, by };
    return this.playback;
  }
}

// Where the stream is now: if it's playing, it's moved on since the last update.
export function positionAt(playback: Playback, now: number): number {
  return playback.playing ? playback.position + Math.max(0, now - playback.updatedAt) / 1000 : playback.position;
}

// Names and text arrive from strangers: no control characters, no runs of spaces, sensible lengths.
export function cleanName(name: string): string {
  const cleaned = name.replace(/\p{Cc}/gu, "").replace(/\s+/g, " ").trim().slice(0, 20).trim();
  return cleaned || "Guest";
}

export function cleanText(text: string): string {
  return text.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").replace(/[ \t]+/g, " ").trim();
}

// "12:05" for 725 seconds; "1:02:05" past an hour.
export function formatPosition(seconds: number): string {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
