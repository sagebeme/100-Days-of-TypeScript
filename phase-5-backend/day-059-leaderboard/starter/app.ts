// Already written: the HTTP side. The interesting code today is in migrate.ts and leaderboard.ts.
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { z } from "zod";
import { submitScore, leaderboard, standing, recentScores } from "./leaderboard.ts";
import type { Db } from "./db.ts";

export const GAMES = ["rider-rush", "bao"] as const;

const ScoreSchema = z.object({
  player: z.string().trim().min(2, "player needs at least 2 characters").max(20, "player can be at most 20 characters"),
  points: z.number().int("points must be whole").min(0, "points can't be negative").max(1_000_000, "that score is not believable"),
  country: z.string().regex(/^[A-Z]{2}$/, "country must be a two-letter code like KE").optional(),
});

const check = <S extends z.ZodType>(schema: S) =>
  validator("json", (value) => {
    const result = schema.safeParse(value);
    if (!result.success) throw new HTTPException(422, { message: result.error.issues.map((i) => i.message).join("; ") });
    return result.data as z.output<S>;
  });

export function createApp(db: Db) {
  const game = (name: string) => {
    if (!(GAMES as readonly string[]).includes(name)) throw new HTTPException(404, { message: `No game called ${name}` });
    return name;
  };

  const app = new Hono()
    .post("/games/:game/scores", check(ScoreSchema), async (c) => {
      const saved = await submitScore(db, { ...c.req.valid("json"), game: game(c.req.param("game")) });
      const where = await standing(db, c.req.param("game"), c.req.valid("json").player);
      return c.json({ ...saved, ...where }, 201);
    })
    .get("/games/:game/leaderboard", async (c) => {
      const limit = Math.min(Math.max(Number(c.req.query("limit") ?? 10) || 10, 1), 100);
      return c.json({ game: game(c.req.param("game")), entries: await leaderboard(db, c.req.param("game"), limit) });
    })
    .get("/games/:game/players/:name", async (c) => {
      const result = await standing(db, game(c.req.param("game")), c.req.param("name"));
      if (!result) throw new HTTPException(404, { message: `${c.req.param("name")} hasn't played ${c.req.param("game")} yet` });
      return c.json(result);
    })
    .get("/games/:game/recent", async (c) => c.json({ scores: await recentScores(db, game(c.req.param("game"))) }));

  app.onError((error, c) =>
    error instanceof HTTPException ? c.json({ error: error.message }, error.status) : c.json({ error: "Something went wrong on our side" }, 500),
  );
  return app;
}
