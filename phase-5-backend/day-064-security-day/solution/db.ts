import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";

// Already written: a small database with users and street-food reviews.
// (Passwords are hashed with plain SHA-256 here only to keep today short; Day 61's scrypt is the real way.)
export const hashForDemo = (password: string) => createHash("sha256").update(password).digest("hex");

export function openDb(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'fan',
      password_hash TEXT NOT NULL
    );
    CREATE TABLE reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor TEXT NOT NULL,
      author TEXT NOT NULL,
      body TEXT NOT NULL,
      stars INTEGER NOT NULL
    );
  `);
  const addUser = db.prepare("INSERT INTO users (email, name, role, password_hash) VALUES (?, ?, ?, ?)");
  addUser.run("amina@example.com", "Amina", "fan", hashForDemo("matatu-sunset-42"));
  addUser.run("admin@example.com", "Site Admin", "admin", hashForDemo("a-very-secret-admin-pass"));
  const addReview = db.prepare("INSERT INTO reviews (vendor, author, body, stars) VALUES (?, ?, ?, ?)");
  addReview.run("Githeri Express", "Amina", "Best githeri in town, and cheap.", 5);
  addReview.run("Ngara Bhajia House", "Baraka", "Crispy bhajia, long queue at lunch.", 4);
  addReview.run("Kenyatta Avenue Mutura", "Chebet", "Spicy mutura. Go before 7pm.", 4);
  return db;
}
