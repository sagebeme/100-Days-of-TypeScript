import { DatabaseSync } from "node:sqlite";
import { drizzle, type SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import { schema } from "./schema.ts";

export type Db = SqliteRemoteDatabase<typeof schema>;

export interface Database {
  sqlite: DatabaseSync; // the raw connection: for migrations and anything Drizzle can't do
  db: Db; // Drizzle on top: type-safe queries
  close(): void;
}

// Already written: opens an SQLite database with Node's built-in driver, and connects Drizzle to it.
// ":memory:" gives a fresh, empty database that vanishes when closed: perfect for tests.
export function openDatabase(path: string): Database {
  const sqlite = new DatabaseSync(path);
  sqlite.exec("PRAGMA foreign_keys = ON"); // SQLite ignores REFERENCES unless you switch this on
  sqlite.exec("PRAGMA journal_mode = WAL"); // better for a server that reads while it writes

  // Drizzle's "sqlite-proxy" driver hands us each query; node:sqlite runs it.
  const db = drizzle(
    async (query, params, method) => {
      const statement = sqlite.prepare(query);
      statement.setReturnArrays(true); // Drizzle wants rows as arrays of values
      if (method === "run") {
        statement.run(...(params as never[]));
        return { rows: [] };
      }
      if (method === "get") {
        return { rows: (statement.get(...(params as never[])) ?? undefined) as never };
      }
      return { rows: statement.all(...(params as never[])) as never };
    },
    { schema },
  );

  return { sqlite, db, close: () => sqlite.close() };
}
