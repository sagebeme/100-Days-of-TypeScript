import { sqliteTable, integer, text, primaryKey } from "drizzle-orm/sqlite-core";

// Already written: the tables after migrations 0001 and 0002.
export const ROLES = ["fan", "organiser", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull(),
  role: text("role", { enum: ROLES }).notNull().default("fan"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(),
});

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organiserId: integer("organiser_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  venue: text("venue").notNull(),
  startsAt: text("starts_at").notNull(),
  status: text("status", { enum: ["draft", "published", "cancelled"] }).notNull().default("draft"),
  createdAt: text("created_at").notNull(),
});

export const going = sqliteTable(
  "going",
  {
    eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.eventId, table.userId] })],
);

export const schema = { users, sessions, events, going };
