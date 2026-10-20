// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { migrate, migrations } from "../src/database/migrate";
const databaseName = `quenda_migrations_${randomUUID().replaceAll("-", "")}`;
const baseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgres://quenda:quenda_local@127.0.0.1:55432/quenda";
const testUrl = new URL(baseUrl);
testUrl.pathname = `/${databaseName}`;
let admin: Pool;
let db: Pool;
const silent = () => undefined;
beforeAll(async () => {
  admin = new Pool({ connectionString: baseUrl });
  await admin.query(`CREATE DATABASE "${databaseName}"`);
  db = new Pool({ connectionString: testUrl.toString() });
});
afterAll(async () => {
  if (db) await db.end();
  if (admin) {
    await admin.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
    await admin.end();
  }
});
describe("Versioned database migrations", () => {
  it("should adopt a V0 database without losing data and stay idempotent", async () => {
    const [initial] = await migrations();
    // V0 deployments applied the initial schema directly, without a migrations table.
    await db.query(initial.sql);
    const id = randomUUID();
    await db.query(
      "INSERT INTO municipalities VALUES ($1,$2,'V0','Europe/Madrid','gl',14,2,5,'v0@example.invalid','V0')",
      [id, `v0-${id}`],
    );
    await migrate(testUrl.toString(), silent);
    await migrate(testUrl.toString(), silent);
    const versions = await db.query<{ version: string }>(
      "SELECT version FROM schema_migrations ORDER BY version",
    );
    expect(versions.rows.map((row) => row.version)).toEqual(
      (await migrations()).map((migration) => migration.version),
    );
    const kept = await db.query("SELECT name FROM municipalities WHERE id=$1", [
      id,
    ]);
    expect(kept.rows).toEqual([{ name: "V0" }]);
  });
  it("should refuse to run when an applied migration was edited", async () => {
    await db.query(
      "UPDATE schema_migrations SET checksum='edited' WHERE version='0001'",
    );
    await expect(migrate(testUrl.toString(), silent)).rejects.toThrow(
      /changed after it was applied/,
    );
  });
});
