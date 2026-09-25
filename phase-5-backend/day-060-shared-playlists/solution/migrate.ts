import type { DatabaseSync } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

export interface Migration {
  name: string; // "0002_create_scores.sql"
  sql: string;
  checksum: string; // a fingerprint of the file, to notice if it's edited after it ran
}

export function checksum(sql: string): string {
  return createHash("sha256").update(sql).digest("hex").slice(0, 16);
}

// Every "NNNN_name.sql" file in the folder, in order.
export function readMigrations(folder: string): Migration[] {
  return readdirSync(folder)
    .filter((file) => /^\d{4}_[\w-]+\.sql$/.test(file))
    .sort()
    .map((name) => {
      const sql = readFileSync(join(folder, name), "utf8");
      return { name, sql, checksum: checksum(sql) };
    });
}

// Runs every migration that hasn't run yet, each inside a transaction, and remembers it.
// Safe to call on every start-up: already-applied migrations are skipped.
export function migrate(sqlite: DatabaseSync, migrations: Migration[]): string[] {
  sqlite.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    checksum TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`);
  const applied = new Map(
    (sqlite.prepare("SELECT name, checksum FROM _migrations").all() as { name: string; checksum: string }[]).map((row) => [
      row.name,
      row.checksum,
    ]),
  );

  const ran: string[] = [];
  for (const migration of migrations) {
    const previous = applied.get(migration.name);
    if (previous !== undefined) {
      // Changing a migration that already ran would leave databases that ran the old version different
      // from ones that run the new one. Write a new migration instead.
      if (previous !== migration.checksum) {
        throw new Error(`${migration.name} was edited after it ran. Put the change in a new migration instead.`);
      }
      continue;
    }
    sqlite.exec("BEGIN");
    try {
      sqlite.exec(migration.sql);
      sqlite.prepare("INSERT INTO _migrations (name, checksum) VALUES (?, ?)").run(migration.name, migration.checksum);
      sqlite.exec("COMMIT");
    } catch (error) {
      sqlite.exec("ROLLBACK"); // all or nothing: a half-run migration is worse than none
      throw new Error(`${migration.name} failed: ${error instanceof Error ? error.message : error}`, { cause: error });
    }
    ran.push(migration.name);
  }
  return ran;
}
