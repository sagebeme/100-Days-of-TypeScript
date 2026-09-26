// The messages that travel over the socket, both ways. One file, shared by the server and the page,
// so the two can't disagree.
export type ClientMessage =
  | { type: "join"; room: string; name: string }
  | { type: "chat"; text: string }
  | { type: "react"; emoji: string }
  | { type: "playback"; action: "play" | "pause" | "seek"; position: number };

export interface ChatLine {
  id: number;
  from: string;
  text: string;
  at: number; // ms since 1970
}

export interface Playback {
  playing: boolean;
  position: number; // seconds into the stream, at updatedAt
  updatedAt: number; // ms since 1970
  by: string | null; // who last pressed play, pause or seek
}

export type ServerMessage =
  | { type: "welcome"; you: string; people: string[]; history: ChatLine[]; playback: Playback; serverTime: number }
  | { type: "joined" | "left"; name: string; people: string[] }
  | { type: "chat"; line: ChatLine }
  | { type: "reaction"; from: string; emoji: string }
  | { type: "playback"; playback: Playback }
  | { type: "error"; message: string };

export const REACTIONS = ["🔥", "😂", "⚽", "👏🏾", "😱", "❤️"] as const;
