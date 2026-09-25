import { and, asc, count, desc, eq, gt, gte, lt, lte, max, or, sql } from "drizzle-orm";
// (Some of these imports are for the functions you write.)
void [count, desc, gt, gte, lt, lte, max, comments, tracks];
import { comments, playlistMembers, playlists, playlistTracks, tracks, users } from "./schema.ts";
import type { Database } from "./db.ts";

export type Access = "owner" | "editor" | "viewer" | "none";

export class PlaylistError extends Error {
  readonly kind: "not-found" | "forbidden" | "conflict" | "invalid";

  constructor(kind: PlaylistError["kind"], message: string) {
    super(message);
    this.name = "PlaylistError";
    this.kind = kind;
  }
}

export async function createUser({ db }: Database, name: string): Promise<number> {
  const [user] = await db.insert(users).values({ name }).returning({ id: users.id });
  return user.id;
}

export async function createTrack({ db }: Database, track: { title: string; artist: string; seconds: number }): Promise<number> {
  const [row] = await db.insert(tracks).values(track).returning({ id: tracks.id });
  return row.id;
}

export async function createPlaylist({ db }: Database, ownerId: number, name: string, now = new Date()): Promise<number> {
  const [row] = await db.insert(playlists).values({ name, ownerId, createdAt: now.toISOString() }).returning({ id: playlists.id });
  return row.id;
}

export async function accessOf({ db }: Database, playlistId: number, userId: number): Promise<Access> {
  // TODO: no such playlist -> throw PlaylistError("not-found", `No playlist <id>`)
  // TODO: the owner -> "owner"; a member -> their role; anyone else -> "none"
  throw new Error("not implemented yet");
}

// Already written: throws "forbidden" unless the user's access is one of `allowed`.
async function require(database: Database, playlistId: number, userId: number, allowed: Access[], action: string): Promise<void> {
  const access = await accessOf(database, playlistId, userId);
  if (!allowed.includes(access)) {
    throw new PlaylistError("forbidden", `You can't ${action} this playlist`);
  }
}

// Only the owner shares. Sharing again changes the role.
export async function share(database: Database, playlistId: number, ownerId: number, userId: number, role: "editor" | "viewer"): Promise<void> {
  // TODO: only the owner ("share"); sharing with yourself -> PlaylistError("invalid", "You already own this playlist")
  // TODO: insert the member, or update their role if they're already a member (onConflictDoUpdate)
  throw new Error("not implemented yet");
}

// New tracks go at the end.
export async function addTrack(database: Database, playlistId: number, userId: number, trackId: number): Promise<number> {
  // TODO: owner or editor ("add tracks to"). Inside database.transaction(...):
  //   already on the playlist -> PlaylistError("conflict", "That track is already on the playlist")
  //   position = the highest position so far + 1 (or 1); insert it with addedBy; return the position
  throw new Error("not implemented yet");
}

// Moving a track shifts the ones in between, all in one transaction so the order is never broken.
export async function moveTrack(database: Database, playlistId: number, userId: number, trackId: number, to: number): Promise<void> {
  // TODO: owner or editor ("reorder"). In a transaction:
  //   not on the playlist -> "not-found" "That track isn't on the playlist"
  //   `to` not a whole number from 1 to the number of tracks -> "invalid" `Position must be from 1 to <n>`
  //   moving up (to < from): every track at positions to .. from-1 moves down one (position + 1)
  //   moving down (to > from): every track at positions from+1 .. to moves up one (position - 1)
  //   then put the track at `to`
  throw new Error("not implemented yet");
}

// Removing a track closes the gap it leaves.
export async function removeTrack(database: Database, playlistId: number, userId: number, trackId: number): Promise<void> {
  // TODO: owner or editor ("remove tracks from"). In a transaction: delete it, then every track after it
  //   moves up one. Not on the playlist -> "not-found" "That track isn't on the playlist"
  throw new Error("not implemented yet");
}

export async function comment(database: Database, playlistId: number, userId: number, body: string, now = new Date()): Promise<number> {
  // TODO: anyone with access ("comment on"). The body, trimmed, must be 1-500 characters:
  //   otherwise "invalid" "A comment must be 1 to 500 characters". Returns the new comment's id.
  throw new Error("not implemented yet");
}

export interface PlaylistView {
  id: number;
  name: string;
  owner: string;
  totalSeconds: number;
  tracks: { position: number; title: string; artist: string; seconds: number; addedBy: string }[];
  members: { name: string; role: "editor" | "viewer" }[];
  comments: { author: string; body: string; at: string }[];
}

// The whole playlist in one relational query: owner, tracks in order, members and the newest comments.
export async function viewPlaylist(database: Database, playlistId: number, userId: number): Promise<PlaylistView> {
  // TODO: anyone with access ("see"). ONE db.query.playlists.findFirst with `with: { ... }`:
  //   owner (name), tracks (ordered by position, each with its track and addedByUser),
  //   members (with user), comments (newest first, at most 20, each with its author)
  // TODO: shape it into a PlaylistView: members sorted by name, totalSeconds added up
  throw new Error("not implemented yet");
}

// Every playlist a person can open: their own and the ones shared with them, with track counts.
export async function playlistsFor({ db }: Database, userId: number): Promise<{ id: number; name: string; access: Access; tracks: number }[]> {
  const rows = await db
    .select({
      id: playlists.id,
      name: playlists.name,
      ownerId: playlists.ownerId,
      role: playlistMembers.role,
      tracks: sql<number>`(SELECT count(*) FROM ${playlistTracks} WHERE ${playlistTracks.playlistId} = ${playlists.id})`,
    })
    .from(playlists)
    .leftJoin(playlistMembers, and(eq(playlistMembers.playlistId, playlists.id), eq(playlistMembers.userId, userId)))
    .where(or(eq(playlists.ownerId, userId), eq(playlistMembers.userId, userId)))
    .orderBy(asc(playlists.name));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    access: row.ownerId === userId ? "owner" : (row.role ?? "none"),
    tracks: Number(row.tracks),
  }));
}
