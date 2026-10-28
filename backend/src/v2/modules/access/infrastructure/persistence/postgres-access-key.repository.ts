// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { Database } from "../../../../shared/infrastructure/database";
import { AccessKeyRepository } from "../../domain/access-key.repository";
import {
  AccessKey,
  AccessKeyRecord,
  PublicJwk,
} from "../../domain/access.read-model";
interface KeyRow {
  kid: string;
  publicJwk: PublicJwk;
  privateKeySealed: string;
  createdAt: string;
  retiredAt: string | null;
}
const columns =
  'kid, public_jwk AS "publicJwk", private_key_sealed AS "privateKeySealed", created_at AS "createdAt", retired_at AS "retiredAt"';
function record(row: KeyRow): AccessKeyRecord {
  return {
    ...row,
    createdAt: Temporal.Instant.from(row.createdAt),
    retiredAt: row.retiredAt ? Temporal.Instant.from(row.retiredAt) : null,
  };
}
function publicKey(row: KeyRow): AccessKey {
  const { privateKeySealed: _sealed, ...key } = record(row);
  return key;
}
@Injectable()
export class PostgresAccessKeyRepository extends AccessKeyRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async active(tenantId: string) {
    await this.lock(tenantId);
    const { rows } = await this.db.query<KeyRow>(
      `SELECT ${columns} FROM access_keys WHERE tenant_id=$1 AND retired_at IS NULL`,
      [tenantId],
    );
    return rows[0] ? record(rows[0]) : null;
  }
  async published(tenantId: string, since: Temporal.Instant) {
    const { rows } = await this.db.query<KeyRow>(
      `SELECT ${columns} FROM access_keys WHERE tenant_id=$1 AND (retired_at IS NULL OR retired_at>$2) ORDER BY created_at DESC`,
      [tenantId, since.toString()],
    );
    return rows.map(publicKey);
  }
  async all(tenantId: string) {
    const { rows } = await this.db.query<KeyRow>(
      `SELECT ${columns} FROM access_keys WHERE tenant_id=$1 ORDER BY created_at DESC`,
      [tenantId],
    );
    return rows.map(publicKey);
  }
  async insert(tenantId: string, key: AccessKeyRecord) {
    await this.db.query(
      "INSERT INTO access_keys (kid,tenant_id,public_jwk,private_key_sealed,created_at) VALUES ($1,$2,$3::jsonb,$4,$5)",
      [
        key.kid,
        tenantId,
        JSON.stringify(key.publicJwk),
        key.privateKeySealed,
        key.createdAt.toString(),
      ],
    );
  }
  private async lock(tenantId: string) {
    await this.db.query(
      "SELECT id FROM municipalities WHERE id=$1 FOR UPDATE",
      [tenantId],
    );
  }
  async retireActive(tenantId: string, at: Temporal.Instant) {
    await this.lock(tenantId);
    await this.db.query(
      "UPDATE access_keys SET retired_at=$2 WHERE tenant_id=$1 AND retired_at IS NULL",
      [tenantId, at.toString()],
    );
  }
}
