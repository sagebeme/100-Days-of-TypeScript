-- An order holds seats while the fan pays. Seats count as taken when the order is paid, or is
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
