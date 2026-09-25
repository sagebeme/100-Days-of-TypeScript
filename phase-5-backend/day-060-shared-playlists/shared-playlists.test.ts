import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { openDatabase, type Database } from "./starter/db.ts";
import { migrate, readMigrations } from "./starter/migrate.ts";
import {
  createUser,
  createTrack,
  createPlaylist,
  accessOf,
  share,
  addTrack,
  moveTrack,
  removeTrack,
  comment,
  viewPlaylist,
  playlistsFor,
  PlaylistError,
} from "./starter/playlists.ts";

let database: Database;
let amina: number, baraka: number, chebet: number, dan: number;
let tracks: number[];
let list: number;

beforeEach(async () => {
  database = openDatabase(":memory:");
  migrate(database.sqlite, readMigrations(join(import.meta.dirname, "starter", "migrations")));
  [amina, baraka, chebet, dan] = [await createUser(database, "Amina"), await createUser(database, "Baraka"), await createUser(database, "Chebet"), await createUser(database, "Dan")];
  tracks = [];
  for (const [title, seconds] of [["Track A", 200], ["Track B", 180], ["Track C", 240], ["Track D", 210]] as const) {
    tracks.push(await createTrack(database, { title, artist: `${title} artist`, seconds }));
  }
  list = await createPlaylist(database, amina, "Road trip", new Date("2026-10-05T09:00:00Z"));
});

afterEach(() => database.close());

const order = async (userId = amina) => (await viewPlaylist(database, list, userId)).tracks.map((t) => `${t.position}:${t.title}`);
const failure = async (work: Promise<unknown>) => {
  const error = await work.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(PlaylistError);
  return { kind: (error as PlaylistError).kind, message: (error as PlaylistError).message };
};

describe("access", () => {
  it("knows owners, editors, viewers and strangers", async () => {
    await share(database, list, amina, baraka, "editor");
    await share(database, list, amina, chebet, "viewer");
    expect(await accessOf(database, list, amina)).toBe("owner");
    expect(await accessOf(database, list, baraka)).toBe("editor");
    expect(await accessOf(database, list, chebet)).toBe("viewer");
    expect(await accessOf(database, list, dan)).toBe("none");
  });

  it("lets only the owner share, and sharing again changes the role", async () => {
    await share(database, list, amina, baraka, "viewer");
    await share(database, list, amina, baraka, "editor");
    expect(await accessOf(database, list, baraka)).toBe("editor");
    expect(await failure(share(database, list, baraka, chebet, "editor"))).toEqual({ kind: "forbidden", message: "You can't share this playlist" });
    expect((await failure(share(database, list, amina, amina, "editor"))).kind).toBe("invalid");
  });

  it("says when a playlist doesn't exist", async () => {
    expect(await failure(accessOf(database, 999, amina))).toEqual({ kind: "not-found", message: "No playlist 999" });
  });
});

describe("tracks", () => {
  beforeEach(async () => {
    await share(database, list, amina, baraka, "editor");
    await share(database, list, amina, chebet, "viewer");
  });

  it("adds tracks at the end, by the owner or an editor", async () => {
    expect(await addTrack(database, list, amina, tracks[0])).toBe(1);
    expect(await addTrack(database, list, baraka, tracks[1])).toBe(2);
    expect(await order()).toEqual(["1:Track A", "2:Track B"]);
    expect((await viewPlaylist(database, list, amina)).tracks[1].addedBy).toBe("Baraka");
  });

  it("won't let viewers or strangers add, or anyone add a track twice", async () => {
    expect((await failure(addTrack(database, list, chebet, tracks[0]))).message).toBe("You can't add tracks to this playlist");
    expect((await failure(addTrack(database, list, dan, tracks[0]))).kind).toBe("forbidden");
    await addTrack(database, list, amina, tracks[0]);
    expect(await failure(addTrack(database, list, baraka, tracks[0]))).toEqual({ kind: "conflict", message: "That track is already on the playlist" });
  });

  it("moves a track up, shifting the ones in between down", async () => {
    for (const track of tracks) await addTrack(database, list, amina, track);
    await moveTrack(database, list, baraka, tracks[3], 1);
    expect(await order()).toEqual(["1:Track D", "2:Track A", "3:Track B", "4:Track C"]);
  });

  it("moves a track down, shifting the ones in between up", async () => {
    for (const track of tracks) await addTrack(database, list, amina, track);
    await moveTrack(database, list, amina, tracks[0], 3);
    expect(await order()).toEqual(["1:Track B", "2:Track C", "3:Track A", "4:Track D"]);
  });

  it("refuses impossible moves, and changes nothing", async () => {
    for (const track of tracks.slice(0, 3)) await addTrack(database, list, amina, track);
    expect(await failure(moveTrack(database, list, amina, tracks[0], 9))).toEqual({ kind: "invalid", message: "Position must be from 1 to 3" });
    expect((await failure(moveTrack(database, list, amina, tracks[3], 1))).kind).toBe("not-found");
    expect((await failure(moveTrack(database, list, chebet, tracks[0], 2))).kind).toBe("forbidden");
    expect(await order()).toEqual(["1:Track A", "2:Track B", "3:Track C"]);
  });

  it("closes the gap when a track is removed", async () => {
    for (const track of tracks) await addTrack(database, list, amina, track);
    await removeTrack(database, list, baraka, tracks[1]);
    expect(await order()).toEqual(["1:Track A", "2:Track C", "3:Track D"]);
    expect(await addTrack(database, list, amina, tracks[1])).toBe(4);
  });

  it("rolls back a move that fails halfway", async () => {
    for (const track of tracks.slice(0, 3)) await addTrack(database, list, amina, track);
    database.sqlite.exec(`CREATE TRIGGER no_third BEFORE UPDATE ON playlist_tracks WHEN NEW.position = 3 AND OLD.track_id = ${tracks[0]}
      BEGIN SELECT RAISE(ABORT, 'simulated crash'); END;`);
    const error = await moveTrack(database, list, amina, tracks[0], 3).catch((e: unknown) => e);
    expect(String((error as Error).cause ?? error)).toContain("simulated crash"); // Drizzle wraps the database's error
    expect(await order()).toEqual(["1:Track A", "2:Track B", "3:Track C"]);
  });
});

describe("comments and the full view", () => {
  beforeEach(async () => {
    await share(database, list, amina, chebet, "viewer");
    await addTrack(database, list, amina, tracks[0]);
    await addTrack(database, list, amina, tracks[2]);
  });

  it("lets anyone on the playlist comment, newest first", async () => {
    await comment(database, list, chebet, "  Tune!  ", new Date("2026-10-05T10:00:00Z"));
    await comment(database, list, amina, "Thanks", new Date("2026-10-05T10:05:00Z"));
    const view = await viewPlaylist(database, list, chebet);
    expect(view.comments).toEqual([
      { author: "Amina", body: "Thanks", at: "2026-10-05T10:05:00.000Z" },
      { author: "Chebet", body: "Tune!", at: "2026-10-05T10:00:00.000Z" },
    ]);
  });

  it("refuses empty comments and strangers", async () => {
    expect((await failure(comment(database, list, chebet, "   "))).message).toBe("A comment must be 1 to 500 characters");
    expect((await failure(comment(database, list, chebet, "x".repeat(501)))).kind).toBe("invalid");
    expect((await failure(comment(database, list, dan, "hi"))).message).toBe("You can't comment on this playlist");
  });

  it("returns the whole playlist in one go", async () => {
    expect(await viewPlaylist(database, list, chebet)).toEqual({
      id: list,
      name: "Road trip",
      owner: "Amina",
      totalSeconds: 440,
      tracks: [
        { position: 1, title: "Track A", artist: "Track A artist", seconds: 200, addedBy: "Amina" },
        { position: 2, title: "Track C", artist: "Track C artist", seconds: 240, addedBy: "Amina" },
      ],
      members: [{ name: "Chebet", role: "viewer" }],
      comments: [],
    });
    expect((await failure(viewPlaylist(database, list, dan))).kind).toBe("forbidden");
  });

  it("lists the playlists a person can open", async () => {
    const mine = await createPlaylist(database, chebet, "Chebet's chill");
    await addTrack(database, mine, chebet, tracks[1]);
    expect(await playlistsFor(database, chebet)).toEqual([
      { id: mine, name: "Chebet's chill", access: "owner", tracks: 1 },
      { id: list, name: "Road trip", access: "viewer", tracks: 2 },
    ]);
    expect(await playlistsFor(database, dan)).toEqual([]);
  });

  it("deletes a playlist's tracks, members and comments with it", async () => {
    await comment(database, list, chebet, "bye");
    database.sqlite.exec(`DELETE FROM playlists WHERE id = ${list}`);
    for (const table of ["playlist_tracks", "playlist_members", "comments"]) {
      expect(database.sqlite.prepare(`SELECT count(*) AS n FROM ${table}`).get()).toEqual({ n: 0 });
    }
  });
});
