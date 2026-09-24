import { describe, it, expect } from "vitest";
import { totalDuration, formatDuration, addSong, type Playlist, type Song } from "./starter/playlist.ts";

const song = (title: string, durationSeconds: number): Song => ({ title, artist: "Test Artist", durationSeconds });

describe("totalDuration", () => {
  it("adds up every song", () => {
    const playlist: Playlist = { name: "Matatu Mix", songs: [song("A", 200), song("B", 185), song("C", 200)] };
    expect(totalDuration(playlist)).toBe(585);
  });

  it("is 0 for an empty playlist", () => {
    expect(totalDuration({ name: "Empty", songs: [] })).toBe(0);
  });
});

describe("formatDuration", () => {
  it("formats minutes and seconds", () => {
    expect(formatDuration(585)).toBe("9:45");
  });

  it("pads seconds to two digits", () => {
    expect(formatDuration(61)).toBe("1:01");
  });

  it("handles zero", () => {
    expect(formatDuration(0)).toBe("0:00");
  });

  it("does not roll minutes into hours", () => {
    expect(formatDuration(3600)).toBe("60:00");
  });
});

describe("addSong", () => {
  it("returns a playlist with the song added at the end", () => {
    const original: Playlist = { name: "Road Trip", songs: [song("A", 100)] };
    const updated = addSong(original, song("B", 120));
    expect(updated.name).toBe("Road Trip");
    expect(updated.songs.map((s) => s.title)).toEqual(["A", "B"]);
  });

  it("does not change the original playlist", () => {
    const original: Playlist = { name: "Road Trip", songs: [song("A", 100)] };
    addSong(original, song("B", 120));
    expect(original.songs).toHaveLength(1);
  });
});
