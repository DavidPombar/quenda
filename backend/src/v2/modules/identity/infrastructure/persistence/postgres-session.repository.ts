// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHash, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { SessionRepository } from "../../domain/session.repository";
import { Principal } from "../../../../shared/application/principal";
import { Database } from "../../../../shared/infrastructure/database";
function hash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
function principal(user: Omit<Principal, "grants">): Principal {
  return {
    ...user,
    grants:
      user.role === "manager"
        ? ["bookings:own", "facilities:manage", "insights:view"]
        : ["bookings:own"],
  };
}
@Injectable()
export class PostgresSessionRepository extends SessionRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async findDemoUser(tenantId: string, role: "citizen" | "manager") {
    const { rows } = await this.db.query<Omit<Principal, "grants">>(
      'SELECT id AS "userId", tenant_id AS "tenantId", display_name AS "displayName", role FROM users WHERE tenant_id=$1 AND role=$2 ORDER BY id LIMIT 1',
      [tenantId, role],
    );
    return rows[0] ? principal(rows[0]) : null;
  }
  async create(user: Principal, expiresAt: Temporal.Instant) {
    const token = randomBytes(32).toString("hex");
    await this.db.query("INSERT INTO sessions VALUES ($1,$2,$3,$4)", [
      hash(token),
      user.tenantId,
      user.userId,
      expiresAt.toString(),
    ]);
    return token;
  }
  async find(token: string, now: Temporal.Instant) {
    const { rows } = await this.db.query<Omit<Principal, "grants">>(
      'SELECT u.id AS "userId", u.tenant_id AS "tenantId", u.display_name AS "displayName", u.role FROM sessions s JOIN users u ON u.id=s.user_id AND u.tenant_id=s.tenant_id WHERE s.token_hash=$1 AND s.expires_at>$2',
      [hash(token), now.toString()],
    );
    return rows[0] ? principal(rows[0]) : null;
  }
  async remove(token: string) {
    await this.db.query("DELETE FROM sessions WHERE token_hash=$1", [
      hash(token),
    ]);
  }
}
