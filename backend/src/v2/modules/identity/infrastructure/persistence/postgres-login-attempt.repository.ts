// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import {
  LoginAttempt,
  LoginAttemptRepository,
} from "../../domain/login-attempt.repository";
import { Database } from "../../../../shared/infrastructure/database";
function hash(state: string) {
  return createHash("sha256").update(state).digest("hex");
}
interface AttemptRow extends Omit<LoginAttempt, "expiresAt"> {
  expiresAt: string;
}
@Injectable()
export class PostgresLoginAttemptRepository extends LoginAttemptRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async save(state: string, attempt: LoginAttempt) {
    await this.db.query(
      "INSERT INTO login_attempts (state_hash,tenant_id,nonce,code_verifier,legal_version,return_to,expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [
        hash(state),
        attempt.tenantId,
        attempt.nonce,
        attempt.codeVerifier,
        attempt.legalVersion,
        attempt.returnTo,
        attempt.expiresAt.toString(),
      ],
    );
  }
  async take(state: string) {
    const { rows } = await this.db.query<AttemptRow>(
      'DELETE FROM login_attempts WHERE state_hash=$1 RETURNING tenant_id AS "tenantId", nonce, code_verifier AS "codeVerifier", legal_version AS "legalVersion", return_to AS "returnTo", expires_at AS "expiresAt"',
      [hash(state)],
    );
    const row = rows[0];
    return row
      ? { ...row, expiresAt: Temporal.Instant.from(row.expiresAt) }
      : null;
  }
}
