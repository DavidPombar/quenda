// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { CredentialKeys, PublicSigningKey } from "../../domain/credential-keys";
import { AccessClaims } from "../../domain/access-credential";
import { Database } from "../../../../shared/infrastructure/database";
import { Clock } from "../../../../shared/application/clock";
import {
  StoredSigningKey,
  generateSigningKey,
  jwsKeyId,
  signJws,
  verifyJws,
} from "../crypto/signing-key";
interface Row {
  id: string;
  tenant_id: string;
  public_key: string;
  encrypted_private_key: Buffer;
  created_at: string;
}
@Injectable()
export class PostgresCredentialKeys extends CredentialKeys {
  constructor(
    private readonly db: Database,
    private readonly clock: Clock,
  ) {
    super();
  }
  async sign(tenantId: string, claims: AccessClaims) {
    return signJws(stored(await this.activeRow(tenantId)), claims);
  }
  async verify(tenantId: string, token: string) {
    const id = jwsKeyId(token);
    if (!id || !/^[0-9a-f-]{36}$/.test(id)) return null;
    const row = (
      await this.db.query<Row>(
        "SELECT * FROM municipality_signing_keys WHERE tenant_id=$1 AND id=$2 AND retired_at IS NULL",
        [tenantId, id],
      )
    ).rows[0];
    const claims = row ? verifyJws(token, row.public_key) : null;
    return claims && isClaims(claims) ? claims : null;
  }
  async active(tenantId: string) {
    return toPublic(await this.activeRow(tenantId));
  }
  async rotate(tenantId: string, at: Temporal.Instant) {
    await this.db.query(
      "UPDATE municipality_signing_keys SET retired_at=$2 WHERE tenant_id=$1 AND retired_at IS NULL",
      [tenantId, at.toString()],
    );
    return toPublic(await this.insert(tenantId, at));
  }
  /** Installations that predate access control get their key on first use. */
  private async activeRow(tenantId: string) {
    const current = (
      await this.db.query<Row>(
        "SELECT * FROM municipality_signing_keys WHERE tenant_id=$1 AND retired_at IS NULL",
        [tenantId],
      )
    ).rows[0];
    return current ?? (await this.insert(tenantId, this.clock.now()));
  }
  private async insert(tenantId: string, at: Temporal.Instant) {
    const key = generateSigningKey(tenantId);
    await this.db.query(
      "INSERT INTO municipality_signing_keys (id,tenant_id,public_key,encrypted_private_key,created_at) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING",
      [key.id, tenantId, key.publicKey, key.encryptedPrivateKey, at.toString()],
    );
    // A concurrent first use may have won; the active row is the one that counts.
    return (
      await this.db.query<Row>(
        "SELECT * FROM municipality_signing_keys WHERE tenant_id=$1 AND retired_at IS NULL",
        [tenantId],
      )
    ).rows[0];
  }
}
function stored(row: Row): StoredSigningKey {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    publicKey: row.public_key,
    encryptedPrivateKey: row.encrypted_private_key,
  };
}
function toPublic(row: Row): PublicSigningKey {
  return {
    id: row.id,
    x: row.public_key,
    createdAt: Temporal.Instant.from(row.created_at),
  };
}
function isClaims(
  value: Record<string, unknown>,
): value is AccessClaims & Record<string, unknown> {
  return (
    typeof value.iss === "string" &&
    typeof value.sub === "string" &&
    typeof value.fac === "string" &&
    typeof value.nbf === "number" &&
    typeof value.exp === "number"
  );
}
