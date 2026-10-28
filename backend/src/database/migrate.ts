// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { Pool } from "pg";
import { databaseUrl } from "./config";
const directory = join(__dirname, "migrations");
const pattern = /^(\d{4})_[a-z0-9_]+\.sql$/;
// Any constant works; it only has to be shared by every process that migrates.
const lockKey = 7_384_221;
export type Migration = { version: string; name: string; sql: string };
export async function migrations(): Promise<Migration[]> {
  const files = (await readdir(directory)).filter((file) => pattern.test(file));
  return Promise.all(
    files.sort().map(async (name) => ({
      version: name.slice(0, 4),
      name,
      sql: await readFile(join(directory, name), "utf8"),
    })),
  );
}
function checksum(sql: string) {
  return createHash("sha256").update(sql).digest("hex");
}
/**
 * Applies pending numbered migrations in order, each in its own transaction.
 * An advisory lock serializes concurrent API containers. Applied files are
 * immutable: a changed checksum stops the run instead of silently diverging.
 */
export async function migrate(url = databaseUrl, log = console.log) {
  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [lockKey]);
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        version text PRIMARY KEY, name text NOT NULL, checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )`,
    );
    const applied = new Map(
      (
        await client.query<{ version: string; checksum: string }>(
          "SELECT version, checksum FROM schema_migrations",
        )
      ).rows.map((row) => [row.version, row.checksum]),
    );
    for (const migration of await migrations()) {
      const digest = checksum(migration.sql);
      const recorded = applied.get(migration.version);
      if (recorded === digest) continue;
      if (recorded)
        throw new Error(
          `Migration ${migration.name} changed after it was applied; add a new migration instead`,
        );
      await client.query("BEGIN");
      try {
        await client.query(migration.sql);
        await client.query(
          "INSERT INTO schema_migrations (version, name, checksum) VALUES ($1, $2, $3)",
          [migration.version, migration.name, digest],
        );
        await client.query("COMMIT");
        log(`Applied migration ${migration.name}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client
      .query("SELECT pg_advisory_unlock($1)", [lockKey])
      .catch(() => undefined);
    client.release();
    await pool.end();
  }
}
if (require.main === module)
  void migrate().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
