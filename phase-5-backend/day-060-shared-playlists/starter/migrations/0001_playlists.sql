CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE
);

CREATE TABLE tracks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  seconds INTEGER NOT NULL CHECK (seconds > 0)
);

CREATE TABLE playlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);

-- Many-to-many: a playlist has many tracks, a track is in many playlists. Each row is one track in one
-- playlist, at a position. The same track can't be in the same playlist twice.
CREATE TABLE playlist_tracks (
  playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 1),
  added_by INTEGER NOT NULL REFERENCES users(id),
  PRIMARY KEY (playlist_id, track_id)
);

-- Many-to-many again: who a playlist is shared with, and what they may do.
CREATE TABLE playlist_members (
  playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  PRIMARY KEY (playlist_id, user_id)
);

-- One-to-many: a playlist has many comments.
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 500),
  created_at TEXT NOT NULL
);

CREATE INDEX playlist_tracks_order ON playlist_tracks (playlist_id, position);
CREATE INDEX comments_by_playlist ON comments (playlist_id, created_at);
