-- Everyone starts as a fan. Organisers create events; admins run the platform.
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'fan' CHECK (role IN ('fan', 'organiser', 'admin'));

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organiser_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  venue TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  price_kes INTEGER NOT NULL CHECK (price_kes >= 0),
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
  created_at TEXT NOT NULL
);
