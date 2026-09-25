import { and, asc, count, desc, eq, gt, gte, lt, lte, max, or, sql } from "drizzle-orm";
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
  const playlist = await db.query.playlists.findFirst({ where: eq(playlists.id, playlistId), columns: { ownerId: true } });
  if (!playlist) throw new PlaylistError("not-found", `No playlist ${playlistId}`);
  if (playlist.ownerId === userId) return "owner";
  const member = await db.query.playlistMembers.findFirst({
    where: and(eq(playlistMembers.playlistId, playlistId), eq(playlistMembers.userId, userId)),
  });
  return member?.role ?? "none";
}

async function require(database: Database, playlistId: number, userId: number, allowed: Access[], action: string): Promise<void> {
  const access = await accessOf(database, playlistId, userId);
  if (!allowed.includes(access)) {
    throw new PlaylistError("forbidden", `You can't ${action} this playlist`);
  }
}

// Only the owner shares. Sharing again changes the role.
export async function share(database: Database, playlistId: number, ownerId: number, userId: number, role: "editor" | "viewer"): Promise<void> {
  await require(database, playlistId, ownerId, ["owner"], "share");
  if (userId === ownerId) throw new PlaylistError("invalid", "You already own this playlist");
  await database.db
    .insert(playlistMembers)
    .values({ playlistId, userId, role })
    .onConflictDoUpdate({ target: [playlistMembers.playlistId, playlistMembers.userId], set: { role } });
}

// New tracks go at the end.
export async function addTrack(database: Database, playlistId: number, userId: number, trackId: number): Promise<number> {
  await require(database, playlistId, userId, ["owner", "editor"], "add tracks to");
  return database.transaction(async () => {
    const already = await database.db.query.playlistTracks.findFirst({
      where: and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.trackId, trackId)),
    });
    if (already) throw new PlaylistError("conflict", "That track is already on the playlist");
    const [{ last }] = await database.db
      .select({ last: max(playlistTracks.position) })
      .from(playlistTracks)
      .where(eq(playlistTracks.playlistId, playlistId));
    const position = (last ?? 0) + 1;
    await database.db.insert(playlistTracks).values({ playlistId, trackId, position, addedBy: userId });
    return position;
  });
}

// Moving a track shifts the ones in between, all in one transaction so the order is never broken.
export async function moveTrack(database: Database, playlistId: number, userId: number, trackId: number, to: number): Promise<void> {
  await require(database, playlistId, userId, ["owner", "editor"], "reorder");
  await database.transaction(async () => {
    const { db } = database;
    const here = and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.trackId, trackId));
    const row = await db.query.playlistTracks.findFirst({ where: here });
    if (!row) throw new PlaylistError("not-found", "That track isn't on the playlist");
    const [{ size }] = await db.select({ size: count() }).from(playlistTracks).where(eq(playlistTracks.playlistId, playlistId));
    if (!Number.isInteger(to) || to < 1 || to > size) throw new PlaylistError("invalid", `Position must be from 1 to ${size}`);

    const from = row.position;
    if (to < from) {
      // Moving up: the tracks from `to` down to just above `from` each move one place down.
      await db
        .update(playlistTracks)
        .set({ position: sql`${playlistTracks.position} + 1` })
        .where(and(eq(playlistTracks.playlistId, playlistId), gte(playlistTracks.position, to), lt(playlistTracks.position, from)));
    } else if (to > from) {
      await db
        .update(playlistTracks)
        .set({ position: sql`${playlistTracks.position} - 1` })
        .where(and(eq(playlistTracks.playlistId, playlistId), gt(playlistTracks.position, from), lte(playlistTracks.position, to)));
    }
    await db.update(playlistTracks).set({ position: to }).where(here);
  });
}

// Removing a track closes the gap it leaves.
export async function removeTrack(database: Database, playlistId: number, userId: number, trackId: number): Promise<void> {
  await require(database, playlistId, userId, ["owner", "editor"], "remove tracks from");
  await database.transaction(async () => {
    const { db } = database;
    const here = and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.trackId, trackId));
    const row = await db.query.playlistTracks.findFirst({ where: here });
    if (!row) throw new PlaylistError("not-found", "That track isn't on the playlist");
    await db.delete(playlistTracks).where(here);
    await db
      .update(playlistTracks)
      .set({ position: sql`${playlistTracks.position} - 1` })
      .where(and(eq(playlistTracks.playlistId, playlistId), gt(playlistTracks.position, row.position)));
  });
}

export async function comment(database: Database, playlistId: number, userId: number, body: string, now = new Date()): Promise<number> {
  await require(database, playlistId, userId, ["owner", "editor", "viewer"], "comment on");
  const text = body.trim();
  if (text.length < 1 || text.length > 500) throw new PlaylistError("invalid", "A comment must be 1 to 500 characters");
  const [row] = await database.db
    .insert(comments)
    .values({ playlistId, userId, body: text, createdAt: now.toISOString() })
    .returning({ id: comments.id });
  return row.id;
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
  await require(database, playlistId, userId, ["owner", "editor", "viewer"], "see");
  const playlist = await database.db.query.playlists.findFirst({
    where: eq(playlists.id, playlistId),
    with: {
      owner: { columns: { name: true } },
      tracks: {
        orderBy: [asc(playlistTracks.position)],
        with: { track: true, addedByUser: { columns: { name: true } } },
      },
      members: { with: { user: { columns: { name: true } } } },
      comments: { orderBy: [desc(comments.createdAt), desc(comments.id)], limit: 20, with: { author: { columns: { name: true } } } },
    },
  });
  if (!playlist) throw new PlaylistError("not-found", `No playlist ${playlistId}`);

  const list = playlist.tracks.map((row) => ({
    position: row.position,
    title: row.track.title,
    artist: row.track.artist,
    seconds: row.track.seconds,
    addedBy: row.addedByUser.name,
  }));
  return {
    id: playlist.id,
    name: playlist.name,
    owner: playlist.owner.name,
    totalSeconds: list.reduce((sum, track) => sum + track.seconds, 0),
    tracks: list,
    members: playlist.members.map((m) => ({ name: m.user.name, role: m.role })).sort((a, b) => a.name.localeCompare(b.name)),
    comments: playlist.comments.map((c) => ({ author: c.author.name, body: c.body, at: c.createdAt })),
  };
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
