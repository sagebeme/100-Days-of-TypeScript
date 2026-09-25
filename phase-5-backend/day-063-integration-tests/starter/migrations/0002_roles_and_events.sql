-- Everyone starts as a fan. Organisers create events; admins run the platform.
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'fan' CHECK (role IN ('fan', 'organiser', 'admin'));

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organiser_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  venue TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
  created_at TEXT NOT NULL
);

-- Fans who said they're going. One row per fan per event.
CREATE TABLE going (
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, user_id)
);
