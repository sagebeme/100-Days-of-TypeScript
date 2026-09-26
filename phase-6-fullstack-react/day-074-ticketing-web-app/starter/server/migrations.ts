import { checksum, type Migration } from "./migrate.ts";

// Already written: Day 66's migrations, as code instead of .sql files. Next.js bundles the server
// code, so files next to it aren't guaranteed to be there when it runs; a module always is.
const FILES: { name: string; sql: string }[] = [
  {
    name: '0001_users_and_sessions.sql',
    sql: `CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL, -- never the password itself
  created_at TEXT NOT NULL
);

-- One row per logged-in browser. The id is a HASH of the token in the cookie, so someone who
-- reads this table still can't log in as anyone.
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX sessions_by_user ON sessions (user_id);
`,
  },
  {
    name: '0002_roles_and_events.sql',
    sql: `-- Everyone starts as a fan. Organisers create events; admins run the platform.
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
`,
  },
  {
    name: '0003_orders_and_tickets.sql',
    sql: `-- An order holds seats while the fan pays. Seats count as taken when the order is paid, or is
-- still pending and its hold hasn't run out.
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 10),
  amount_kes INTEGER NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'failed')),
  hold_expires_at TEXT NOT NULL,
  checkout_request_id TEXT UNIQUE, -- M-Pesa's id for the payment: the callback carries it
  receipt TEXT UNIQUE, -- M-Pesa's receipt number, once paid
  problem TEXT, -- why it failed, in words a person can act on
  created_at TEXT NOT NULL,
  paid_at TEXT
);
CREATE INDEX orders_by_event ON orders (event_id, status);

-- One row per seat. The code on the ticket isn't stored: it's worked out from the id and a secret.
CREATE TABLE tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  event_id INTEGER NOT NULL REFERENCES events(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  checked_in_at TEXT,
  checked_in_by INTEGER REFERENCES users(id)
);
CREATE INDEX tickets_by_event ON tickets (event_id);
`,
  },
];

export const MIGRATIONS: Migration[] = FILES.map((file) => ({ ...file, checksum: checksum(file.sql) }));
