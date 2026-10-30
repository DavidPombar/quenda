// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import {
  LoginCode,
  LoginCodeRepository,
  PendingLoginCode,
} from "../../domain/login-code.repository";
import { Database } from "../../../../shared/infrastructure/database";
/** Sending gives up after this many attempts; the person can ask for another code. */
const MAX_SEND_ATTEMPTS = 5;
@Injectable()
export class PostgresLoginCodeRepository extends LoginCodeRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async countSince(
    tenantId: string,
    emailHash: string,
    since: Temporal.Instant,
  ) {
    const { rows } = await this.db.query<{ count: string }>(
      "SELECT count(*) FROM login_codes WHERE tenant_id=$1 AND email_hash=$2 AND created_at>=$3",
      [tenantId, emailHash, since.toString()],
    );
    return Number(rows[0].count);
  }
  async add(code: Parameters<LoginCodeRepository["add"]>[0]) {
    await this.db.query(
      `INSERT INTO login_codes (id,tenant_id,email_hash,recipient,pending_code,code_hash,legal_version,locale,created_at,expires_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        code.id,
        code.tenantId,
        code.emailHash,
        code.recipient,
        code.pendingCode,
        code.codeHash,
        code.legalVersion,
        code.locale,
        code.createdAt.toString(),
        code.expiresAt.toString(),
      ],
    );
  }
  async latest(tenantId: string, emailHash: string) {
    const { rows } = await this.db.query<{
      id: string;
      tenantId: string;
      codeHash: string;
      legalVersion: string;
      attempts: number;
      expiresAt: string;
      consumedAt: string | null;
    }>(
      `SELECT id, tenant_id AS "tenantId", code_hash AS "codeHash", legal_version AS "legalVersion",
        attempts, expires_at AS "expiresAt", consumed_at AS "consumedAt"
      FROM login_codes WHERE tenant_id=$1 AND email_hash=$2
      ORDER BY created_at DESC, id LIMIT 1 FOR UPDATE`,
      [tenantId, emailHash],
    );
    const row = rows[0];
    return row
      ? ({
          ...row,
          expiresAt: Temporal.Instant.from(row.expiresAt),
          consumedAt: row.consumedAt
            ? Temporal.Instant.from(row.consumedAt)
            : null,
        } satisfies LoginCode)
      : null;
  }
  async recordFailure(id: string) {
    await this.db.query(
      "UPDATE login_codes SET attempts=attempts+1 WHERE id=$1",
      [id],
    );
  }
  async consume(id: string, at: Temporal.Instant) {
    await this.db.query(
      "UPDATE login_codes SET consumed_at=$2, recipient=NULL, pending_code=NULL WHERE id=$1",
      [id, at.toString()],
    );
  }
  async claim(args: { id?: string; now: Temporal.Instant; limit: number }) {
    const { rows } = await this.db.query<PendingLoginCode>(
      `WITH due AS (
        SELECT id FROM login_codes
        WHERE ($1::uuid IS NULL OR id=$1) AND sent_at IS NULL AND pending_code IS NOT NULL
          AND consumed_at IS NULL AND expires_at>$2 AND send_attempts<$4
          AND (locked_until IS NULL OR locked_until<$2)
        ORDER BY created_at LIMIT $3 FOR UPDATE SKIP LOCKED
      )
      UPDATE login_codes c SET locked_until=$2::timestamptz + interval '2 minutes', send_attempts=c.send_attempts+1
      FROM due WHERE c.id=due.id
      RETURNING c.id, c.tenant_id AS "tenantId", c.recipient, c.pending_code AS code, c.locale,
        c.send_attempts AS "sendAttempts"`,
      [args.id ?? null, args.now.toString(), args.limit, MAX_SEND_ATTEMPTS],
    );
    return rows;
  }
  async markSent(id: string, at: Temporal.Instant) {
    await this.db.query(
      "UPDATE login_codes SET sent_at=$2, recipient=NULL, pending_code=NULL, locked_until=NULL, last_error=NULL WHERE id=$1",
      [id, at.toString()],
    );
  }
  async markFailed(id: string, error: string) {
    await this.db.query(
      "UPDATE login_codes SET locked_until=NULL, last_error=$2 WHERE id=$1",
      [id, error.slice(0, 500)],
    );
  }
}
