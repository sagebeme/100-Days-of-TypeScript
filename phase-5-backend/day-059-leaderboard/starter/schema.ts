import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Already written: the tables as Drizzle sees them. They must match what the migrations create.
// Drizzle uses this to write type-safe SQL for you; the migrations are what actually create the tables.
export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  country: text("country"),
  createdAt: text("created_at").notNull(),
});

export const scores = sqliteTable(
  "scores",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    game: text("game").notNull(),
    points: integer("points").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("scores_game_points").on(table.game, table.points)],
);

export const playersRelations = relations(players, ({ many }) => ({ scores: many(scores) }));
export const scoresRelations = relations(scores, ({ one }) => ({
  player: one(players, { fields: [scores.playerId], references: [players.id] }),
}));

export const schema = { players, scores, playersRelations, scoresRelations };
