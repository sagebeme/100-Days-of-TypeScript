import { and, desc, eq, max, count, asc, gt, sql } from "drizzle-orm";
import { players, scores } from "./schema.ts";
import type { Db } from "./db.ts";

export interface Submission {
  player: string;
  game: string;
  points: number;
  country?: string;
}

export interface Entry {
  rank: number;
  player: string;
  country: string | null;
  best: number;
  games: number; // how many scores they've submitted
}

// Finds the player by name (any case), or creates them. Then records the score.
export async function submitScore(db: Db, submission: Submission, now: Date = new Date()): Promise<{ playerId: number; points: number }> {
  // TODO: insert the player, doing nothing if the name already exists (onConflictDoNothing on players.name)
  // TODO: find them by name, ignoring case: sql`${players.name} = ${name} COLLATE NOCASE`
  // TODO: if a country was sent and it's different, update it
  // TODO: insert the score (with createdAt: now as an ISO string), and return { playerId, points }
  throw new Error("not implemented yet");
}

// Each player's best score in a game, highest first. Ties are broken alphabetically.
export async function leaderboard(db: Db, game: string, limit = 10): Promise<Entry[]> {
  // TODO: select player name, country, max(points) as "best" and count(scores) from scores,
  //   joined to players, for this game, grouped by player, ordered by best (highest first) then name,
  //   limited to `limit`
  // TODO: add ranks, where equal scores share a rank: 1, 2, 2, 4
  throw new Error("not implemented yet");
}

// Where one player stands: their best, and 1 + the number of players who beat it.
export async function standing(db: Db, game: string, name: string): Promise<{ rank: number; best: number; of: number } | null> {
  // TODO: find the player (any case); unknown -> null
  // TODO: a subquery of every player's best in this game; the player's own best (none -> null);
  //   rank = 1 + how many bests are higher; of = how many players have a score
  throw new Error("not implemented yet");
}

export interface RecentScore {
  id: number;
  playerId: number;
  game: string;
  points: number;
  createdAt: string;
  player: { name: string; country: string | null };
}

export async function recentScores(db: Db, game: string, limit = 5): Promise<RecentScore[]> {
  // TODO: the newest scores for the game, with each score's player's name and country
  //   (db.query.scores.findMany with `with: { player: ... }`)
  void [and, desc, eq, max, count, asc, gt, sql, players, scores];
  throw new Error("not implemented yet");
}
