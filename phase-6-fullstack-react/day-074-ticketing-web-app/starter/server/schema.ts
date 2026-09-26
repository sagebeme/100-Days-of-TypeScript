import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

// Already written: the tables after migrations 0001 to 0003.
export const ROLES = ["fan", "organiser", "admin"] as const;
export type Role = (typeof ROLES)[number];
export const EVENT_STATUSES = ["draft", "published", "cancelled"] as const;
export const ORDER_STATUSES = ["pending", "paid", "cancelled", "failed"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

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
  priceKes: integer("price_kes").notNull(),
  capacity: integer("capacity").notNull(),
  status: text("status", { enum: EVENT_STATUSES }).notNull().default("draft"),
  createdAt: text("created_at").notNull(),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull().references(() => events.id),
  userId: integer("user_id").notNull().references(() => users.id),
  quantity: integer("quantity").notNull(),
  amountKes: integer("amount_kes").notNull(),
  phone: text("phone").notNull(),
  status: text("status", { enum: ORDER_STATUSES }).notNull().default("pending"),
  holdExpiresAt: text("hold_expires_at").notNull(),
  checkoutRequestId: text("checkout_request_id").unique(),
  receipt: text("receipt").unique(),
  problem: text("problem"),
  createdAt: text("created_at").notNull(),
  paidAt: text("paid_at"),
});

export const tickets = sqliteTable("tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  eventId: integer("event_id").notNull().references(() => events.id),
  userId: integer("user_id").notNull().references(() => users.id),
  checkedInAt: text("checked_in_at"),
  checkedInBy: integer("checked_in_by").references(() => users.id),
});

export const schema = { users, sessions, events, orders, tickets };
export type EventRow = typeof events.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
