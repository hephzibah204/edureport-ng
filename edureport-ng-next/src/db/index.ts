import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export { schema };

export async function migrate(d1: D1Database): Promise<void> {
  const stmt = d1.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='__drizzle_migrations'`
  );
  const result = await stmt.first();
  if (!result) {
    await d1.prepare(
      `CREATE TABLE IF NOT EXISTS __drizzle_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, hash TEXT NOT NULL, created_at TEXT NOT NULL)`
    ).run();
  }
}
