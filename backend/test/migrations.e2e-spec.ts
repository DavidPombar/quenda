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
  it("should preserve a database from main before versioned migrations were introduced", async () => {
    const name = `${databaseName}_main`;
    const url = new URL(baseUrl);
    url.pathname = `/${name}`;
    await admin.query(`CREATE DATABASE "${name}"`);
    const legacy = new Pool({ connectionString: url.toString() });
    try {
      const schema = (await migrations()).find(
        (migration) => migration.version === "0003",
      )!;
      await legacy.query(schema.sql);
      const id = randomUUID();
      await legacy.query(
        "INSERT INTO municipalities (id,slug,name,timezone,advance_days,cancellation_hours,max_active_bookings,contact,legal_text,retention_months,primary_color) VALUES ($1,$2,'Existing council','Europe/Madrid',21,3,8,'contact@example.invalid','Existing notice',18,'#123456')",
        [id, `existing-${id}`],
      );
      await legacy.query(
        "INSERT INTO legal_texts VALUES ($1,'2026-10','Galego','Castellano','2026-10-20T10:00:00Z')",
        [id],
      );
      await migrate(url.toString(), silent);
      await migrate(url.toString(), silent);
      expect(
        (
          await legacy.query(
            "SELECT advance_days,retention_months,primary_color FROM municipalities WHERE id=$1",
            [id],
          )
        ).rows,
      ).toEqual([
        { advance_days: 21, retention_months: 18, primary_color: "#123456" },
      ]);
      expect(
        (
          await legacy.query(
            "SELECT text_gl,text_es FROM legal_texts WHERE tenant_id=$1",
            [id],
          )
        ).rows,
      ).toEqual([{ text_gl: "Galego", text_es: "Castellano" }]);
      expect(
        (
          await legacy.query(
            "SELECT count(*)::int AS count FROM schema_migrations",
          )
        ).rows[0].count,
      ).toBe((await migrations()).length);
    } finally {
      await legacy.end();
      await admin.query(`DROP DATABASE "${name}"`);
    }
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
