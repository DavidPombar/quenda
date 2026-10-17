// SPDX-License-Identifier: AGPL-3.0-or-later
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Pool } from "pg";
import { databaseUrl } from "./config";
export async function migrate(url = databaseUrl) {
  const pool = new Pool({ connectionString: url });
  try {
    await pool.query(await readFile(join(__dirname, "schema.sql"), "utf8"));
  } finally {
    await pool.end();
  }
}
if (require.main === module)
  void migrate().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
