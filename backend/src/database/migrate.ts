// SPDX-License-Identifier: AGPL-3.0-or-later
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Pool } from "pg";
import { databaseUrl } from "./config";
import { provisionSigningKeys } from "../v2/modules/access/infrastructure/crypto/provision-signing-keys";
export async function migrate(url = databaseUrl) {
  const pool = new Pool({ connectionString: url });
  try {
    await pool.query(await readFile(join(__dirname, "schema.sql"), "utf8"));
    await provisionSigningKeys(pool);
  } finally {
    await pool.end();
  }
}
if (require.main === module)
  void migrate().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
