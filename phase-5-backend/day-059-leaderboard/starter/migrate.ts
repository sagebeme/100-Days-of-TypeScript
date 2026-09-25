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
  // TODO: the files whose names look like 0001_something.sql, sorted by name, each read with its checksum
  throw new Error("not implemented yet");
}

// Runs every migration that hasn't run yet, each inside a transaction, and remembers it.
// Safe to call on every start-up: already-applied migrations are skipped.
export function migrate(sqlite: DatabaseSync, migrations: Migration[]): string[] {
  // TODO: create the _migrations table if it isn't there: name (primary key), checksum, applied_at
  // TODO: for each migration, in order:
  //   already applied with the same checksum -> skip it
  //   already applied with a DIFFERENT checksum -> throw "<name> was edited after it ran. Put the change in a new migration instead."
  //   not applied -> BEGIN; run its SQL; record its name and checksum; COMMIT.
  //     If anything fails: ROLLBACK, then throw "<name> failed: <message>"
  // TODO: return the names of the migrations that ran this time
  void readdirSync;
  void readFileSync;
  void join;
  throw new Error("not implemented yet");
}
