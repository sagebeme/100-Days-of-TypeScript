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
  await db
    .insert(players)
    .values({ name: submission.player, country: submission.country ?? null, createdAt: now.toISOString() })
    .onConflictDoNothing({ target: players.name });
  const player = await db.query.players.findFirst({ where: sql`${players.name} = ${submission.player} COLLATE NOCASE` });
  if (!player) throw new Error(`Couldn't find or create ${submission.player}`);
  if (submission.country && player.country !== submission.country) {
    await db.update(players).set({ country: submission.country }).where(eq(players.id, player.id));
  }
  await db.insert(scores).values({ playerId: player.id, game: submission.game, points: submission.points, createdAt: now.toISOString() });
  return { playerId: player.id, points: submission.points };
}

// Each player's best score in a game, highest first. Ties are broken alphabetically.
export async function leaderboard(db: Db, game: string, limit = 10): Promise<Entry[]> {
  const rows = await db
    .select({
      player: players.name,
      country: players.country,
      best: max(scores.points).as("best"),
      games: count(scores.id),
    })
    .from(scores)
    .innerJoin(players, eq(players.id, scores.playerId))
    .where(eq(scores.game, game))
    .groupBy(players.id)
    .orderBy(desc(sql`best`), asc(players.name))
    .limit(limit);

  // Equal scores share a rank: 1, 2, 2, 4.
  let rank = 0;
  return rows.map((row, i) => {
    if (i === 0 || row.best !== rows[i - 1].best) rank = i + 1;
    return { rank, player: row.player, country: row.country, best: row.best ?? 0, games: row.games };
  });
}

// Where one player stands: their best, and 1 + the number of players who beat it.
export async function standing(db: Db, game: string, name: string): Promise<{ rank: number; best: number; of: number } | null> {
  const player = await db.query.players.findFirst({ where: sql`${players.name} = ${name} COLLATE NOCASE` });
  if (!player) return null;

  const bests = db
    .select({ playerId: scores.playerId, best: max(scores.points).as("best") })
    .from(scores)
    .where(eq(scores.game, game))
    .groupBy(scores.playerId)
    .as("bests");

  const [mine] = await db.select({ best: bests.best }).from(bests).where(eq(bests.playerId, player.id));
  if (!mine || mine.best === null) return null;
  const [{ better }] = await db.select({ better: count() }).from(bests).where(gt(bests.best, mine.best));
  const [{ total }] = await db.select({ total: count() }).from(bests);
  return { rank: better + 1, best: mine.best, of: total };
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
  return db.query.scores.findMany({
    where: and(eq(scores.game, game)),
    orderBy: [desc(scores.createdAt), desc(scores.id)],
    limit,
    with: { player: { columns: { name: true, country: true } } },
  });
}
