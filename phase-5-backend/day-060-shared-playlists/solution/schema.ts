import { sqliteTable, integer, text, primaryKey } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Already written: the same tables as migrations/0001_playlists.sql, for Drizzle.
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const tracks = sqliteTable("tracks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  seconds: integer("seconds").notNull(),
});

export const playlists = sqliteTable("playlists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull(),
});

export const playlistTracks = sqliteTable(
  "playlist_tracks",
  {
    playlistId: integer("playlist_id").notNull().references(() => playlists.id, { onDelete: "cascade" }),
    trackId: integer("track_id").notNull().references(() => tracks.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    addedBy: integer("added_by").notNull().references(() => users.id),
  },
  (table) => [primaryKey({ columns: [table.playlistId, table.trackId] })],
);

export const playlistMembers = sqliteTable(
  "playlist_members",
  {
    playlistId: integer("playlist_id").notNull().references(() => playlists.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["editor", "viewer"] }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.playlistId, table.userId] })],
);

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playlistId: integer("playlist_id").notNull().references(() => playlists.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull(),
});

// Relations tell Drizzle how tables connect, so one query can fetch a playlist with everything in it.
export const usersRelations = relations(users, ({ many }) => ({
  playlists: many(playlists),
  memberships: many(playlistMembers),
}));
export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  owner: one(users, { fields: [playlists.ownerId], references: [users.id] }),
  tracks: many(playlistTracks),
  members: many(playlistMembers),
  comments: many(comments),
}));
export const playlistTracksRelations = relations(playlistTracks, ({ one }) => ({
  playlist: one(playlists, { fields: [playlistTracks.playlistId], references: [playlists.id] }),
  track: one(tracks, { fields: [playlistTracks.trackId], references: [tracks.id] }),
  addedByUser: one(users, { fields: [playlistTracks.addedBy], references: [users.id] }),
}));
export const playlistMembersRelations = relations(playlistMembers, ({ one }) => ({
  playlist: one(playlists, { fields: [playlistMembers.playlistId], references: [playlists.id] }),
  user: one(users, { fields: [playlistMembers.userId], references: [users.id] }),
}));
export const commentsRelations = relations(comments, ({ one }) => ({
  playlist: one(playlists, { fields: [comments.playlistId], references: [playlists.id] }),
  author: one(users, { fields: [comments.userId], references: [users.id] }),
}));

export const schema = {
  users,
  tracks,
  playlists,
  playlistTracks,
  playlistMembers,
  comments,
  usersRelations,
  playlistsRelations,
  playlistTracksRelations,
  playlistMembersRelations,
  commentsRelations,
};
