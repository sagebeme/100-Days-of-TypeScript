import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase, type Database } from "./starter/db.ts";
import { migrate, readMigrations, checksum } from "./starter/migrate.ts";
import { submitScore, leaderboard, standing, recentScores } from "./starter/leaderboard.ts";
import { createApp } from "./starter/app.ts";

const MIGRATIONS = join(import.meta.dirname, "starter", "migrations");
const tableNames = (database: Database) =>
  (database.sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string }[]).map(
    (row) => row.name,
  );

describe("migrations", () => {
  let database: Database;
  let folder: string;

  beforeEach(() => {
    database = openDatabase(":memory:");
    folder = mkdtempSync(join(tmpdir(), "migrations-"));
    cpSync(MIGRATIONS, folder, { recursive: true });
  });

  afterEach(() => {
    database.close();
    rmSync(folder, { recursive: true, force: true });
  });

  it("reads the numbered .sql files in order, ignoring anything else", () => {
    writeFileSync(join(folder, "notes.txt"), "not a migration");
    writeFileSync(join(folder, "0010_later.sql"), "SELECT 1;");
    const found = readMigrations(folder);
    expect(found.map((m) => m.name)).toEqual(["0001_create_players.sql", "0002_create_scores.sql", "0003_add_country.sql", "0010_later.sql"]);
    expect(found[3]).toEqual({ name: "0010_later.sql", sql: "SELECT 1;", checksum: checksum("SELECT 1;") });
  });

  it("creates the tables, and records what it ran", () => {
    expect(migrate(database.sqlite, readMigrations(folder))).toEqual(["0001_create_players.sql", "0002_create_scores.sql", "0003_add_country.sql"]);
    expect(tableNames(database)).toEqual(["_migrations", "players", "scores"]);
    const columns = (database.sqlite.prepare("PRAGMA table_info(players)").all() as { name: string }[]).map((c) => c.name);
    expect(columns).toContain("country");
  });

  it("does nothing the second time", () => {
    migrate(database.sqlite, readMigrations(folder));
    expect(migrate(database.sqlite, readMigrations(folder))).toEqual([]);
  });

  it("runs only the new ones", () => {
    migrate(database.sqlite, readMigrations(folder));
    writeFileSync(join(folder, "0004_add_avatar.sql"), "ALTER TABLE players ADD COLUMN avatar TEXT;");
    expect(migrate(database.sqlite, readMigrations(folder))).toEqual(["0004_add_avatar.sql"]);
  });

  it("refuses to carry on if a migration that already ran was edited", () => {
    migrate(database.sqlite, readMigrations(folder));
    writeFileSync(join(folder, "0003_add_country.sql"), "ALTER TABLE players ADD COLUMN country TEXT;");
    expect(() => migrate(database.sqlite, readMigrations(folder))).toThrow(
      "0003_add_country.sql was edited after it ran. Put the change in a new migration instead.",
    );
  });

  it("rolls back a migration that fails halfway, so nothing is half done", () => {
    migrate(database.sqlite, readMigrations(folder));
    writeFileSync(join(folder, "0004_broken.sql"), "CREATE TABLE teams (id INTEGER PRIMARY KEY);\nCREATE TABLE oops (;");
    expect(() => migrate(database.sqlite, readMigrations(folder))).toThrow(/^0004_broken\.sql failed: /);
    expect(tableNames(database)).not.toContain("teams");
    expect(database.sqlite.prepare("SELECT count(*) AS n FROM _migrations").get()).toEqual({ n: 3 });
  });
});

describe("the leaderboard queries", () => {
  let database: Database;
  let clock: number;
  const at = () => new Date((clock += 60_000));

  beforeEach(() => {
    database = openDatabase(":memory:");
    migrate(database.sqlite, readMigrations(MIGRATIONS));
    clock = Date.parse("2026-10-05T10:00:00Z");
  });

  afterEach(() => database.close());

  it("keeps each player's best score, highest first, with shared ranks for ties", async () => {
    await submitScore(database.db, { player: "Amina", game: "rider-rush", points: 12, country: "KE" }, at());
    await submitScore(database.db, { player: "amina", game: "rider-rush", points: 30 }, at());
    await submitScore(database.db, { player: "Baraka", game: "rider-rush", points: 30, country: "UG" }, at());
    await submitScore(database.db, { player: "Chebet", game: "rider-rush", points: 7 }, at());
    expect(await leaderboard(database.db, "rider-rush")).toEqual([
      { rank: 1, player: "Amina", country: "KE", best: 30, games: 2 },
      { rank: 1, player: "Baraka", country: "UG", best: 30, games: 1 },
      { rank: 3, player: "Chebet", country: null, best: 7, games: 1 },
    ]);
  });

  it("treats names as the same player whatever the case", async () => {
    await submitScore(database.db, { player: "Amina", game: "bao", points: 10 }, at());
    const second = await submitScore(database.db, { player: "AMINA", game: "bao", points: 20 }, at());
    const first = await database.db.query.players.findMany();
    expect(first).toHaveLength(1);
    expect(second.playerId).toBe(first[0].id);
  });

  it("keeps the games apart, and respects the limit", async () => {
    for (const [player, points] of [["A1", 5], ["B2", 9], ["C3", 7]] as const) {
      await submitScore(database.db, { player, game: "rider-rush", points }, at());
    }
    await submitScore(database.db, { player: "D4", game: "bao", points: 99 }, at());
    expect((await leaderboard(database.db, "rider-rush", 2)).map((e) => e.player)).toEqual(["B2", "C3"]);
    expect((await leaderboard(database.db, "bao")).map((e) => e.player)).toEqual(["D4"]);
    expect(await leaderboard(database.db, "chess")).toEqual([]);
  });

  it("updates a player's country when they send a new one", async () => {
    await submitScore(database.db, { player: "Amina", game: "bao", points: 1, country: "KE" }, at());
    await submitScore(database.db, { player: "Amina", game: "bao", points: 2, country: "TZ" }, at());
    expect((await leaderboard(database.db, "bao"))[0].country).toBe("TZ");
  });

  it("tells a player where they stand", async () => {
    await submitScore(database.db, { player: "Amina", game: "rider-rush", points: 30 }, at());
    await submitScore(database.db, { player: "Baraka", game: "rider-rush", points: 30 }, at());
    await submitScore(database.db, { player: "Chebet", game: "rider-rush", points: 7 }, at());
    expect(await standing(database.db, "rider-rush", "chebet")).toEqual({ rank: 3, best: 7, of: 3 });
    expect(await standing(database.db, "rider-rush", "Baraka")).toEqual({ rank: 1, best: 30, of: 3 });
    expect(await standing(database.db, "rider-rush", "Nobody")).toBeNull();
    expect(await standing(database.db, "bao", "Amina")).toBeNull();
  });

  it("shows the newest scores with their players", async () => {
    await submitScore(database.db, { player: "Amina", game: "bao", points: 10, country: "KE" }, at());
    await submitScore(database.db, { player: "Baraka", game: "bao", points: 20 }, at());
    const recent = await recentScores(database.db, "bao", 1);
    expect(recent).toHaveLength(1);
    expect(recent[0]).toMatchObject({ points: 20, player: { name: "Baraka", country: null } });
  });

  it("lets the database refuse impossible data", async () => {
    await expect(submitScore(database.db, { player: "Amina", game: "bao", points: -1 }, at())).rejects.toThrow();
    expect(() => database.sqlite.exec("INSERT INTO scores (player_id, game, points, created_at) VALUES (999, 'bao', 5, 'now')")).toThrow(/FOREIGN KEY/);
  });
});

describe("the leaderboard API", () => {
  let database: Database;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    database = openDatabase(":memory:");
    migrate(database.sqlite, readMigrations(MIGRATIONS));
    app = createApp(database.db);
  });

  afterEach(() => database.close());

  const post = (game: string, body: unknown) =>
    app.request(`/games/${game}/scores`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  it("takes a score and says where it ranks", async () => {
    await post("rider-rush", { player: "Amina", points: 30 });
    const response = await post("rider-rush", { player: "Baraka", points: 12, country: "UG" });
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ points: 12, rank: 2, best: 12, of: 2 });
    const board = await (await app.request("/games/rider-rush/leaderboard")).json();
    expect(board.entries.map((e: { player: string }) => e.player)).toEqual(["Amina", "Baraka"]);
  });

  it("rejects bad scores and unknown games", async () => {
    expect((await post("rider-rush", { player: "A", points: 5 })).status).toBe(422);
    expect((await post("rider-rush", { player: "Amina", points: 5.5 })).status).toBe(422);
    expect((await post("chess", { player: "Amina", points: 5 })).status).toBe(404);
    expect((await app.request("/games/rider-rush/players/Nobody")).status).toBe(404);
  });
});
