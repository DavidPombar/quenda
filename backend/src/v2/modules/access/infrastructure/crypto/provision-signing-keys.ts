// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Pool } from "pg";
import { generateSigningKey } from "./signing-key";
/**
 * Gives each municipality without an active key its own, as part of installing it (seed) or
 * upgrading an installation (migrate). Concurrent runs are safe: one active key per tenant.
 */
export async function provisionSigningKeys(db: Pool) {
  const { rows } = await db.query<{ id: string }>(
    "SELECT m.id FROM municipalities m WHERE NOT EXISTS (SELECT 1 FROM municipality_signing_keys k WHERE k.tenant_id=m.id AND k.retired_at IS NULL)",
  );
  for (const { id } of rows) {
    const key = generateSigningKey(id);
    await db.query(
      "INSERT INTO municipality_signing_keys (id,tenant_id,public_key,encrypted_private_key,created_at) VALUES ($1,$2,$3,$4,now()) ON CONFLICT DO NOTHING",
      [key.id, id, key.publicKey, key.encryptedPrivateKey],
    );
  }
  return rows.length;
}
