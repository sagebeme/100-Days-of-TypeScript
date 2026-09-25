import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

// Already written: the tables from migrations/0001_users_and_sessions.sql.
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), // sha256 of the token in the cookie
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(),
});

export const schema = { users, sessions };
