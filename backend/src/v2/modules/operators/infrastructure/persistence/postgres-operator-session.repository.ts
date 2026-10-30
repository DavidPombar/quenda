// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHash, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { OperatorSessionRepository } from "../../domain/operator-session.repository";
import { OperatorPrincipal } from "../../../../shared/application/operator-principal";
import { Database } from "../../../../shared/infrastructure/database";
function hash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
function principal(row: {
  operatorId: string;
  displayName: string;
}): OperatorPrincipal {
  return { ...row, grants: ["deployment:manage", "deployment:insights"] };
}
@Injectable()
export class PostgresOperatorSessionRepository extends OperatorSessionRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async findDemoOperator() {
    const { rows } = await this.db.query<{
      operatorId: string;
      displayName: string;
    }>(
      // Operators with a local account (#8) are never handed out by the demo sign-in.
      `SELECT id AS "operatorId", display_name AS "displayName" FROM operators o WHERE deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM credentials c WHERE c.realm='operator' AND c.subject_id=o.id)
      ORDER BY id LIMIT 1`,
    );
    return rows[0] ? principal(rows[0]) : null;
  }
  async create(operator: OperatorPrincipal, expiresAt: Temporal.Instant) {
    const token = randomBytes(32).toString("hex");
    await this.db.query(
      "INSERT INTO operator_sessions (token_hash,operator_id,expires_at) VALUES ($1,$2,$3)",
      [hash(token), operator.operatorId, expiresAt.toString()],
    );
    return token;
  }
  async find(token: string, now: Temporal.Instant) {
    if (!token) return null;
    const { rows } = await this.db.query<{
      operatorId: string;
      displayName: string;
    }>(
      'SELECT o.id AS "operatorId", o.display_name AS "displayName" FROM operator_sessions s JOIN operators o ON o.id=s.operator_id WHERE s.token_hash=$1 AND s.expires_at>$2 AND o.deleted_at IS NULL',
      [hash(token), now.toString()],
    );
    return rows[0] ? principal(rows[0]) : null;
  }
  async remove(token: string) {
    await this.db.query("DELETE FROM operator_sessions WHERE token_hash=$1", [
      hash(token),
    ]);
  }
}
