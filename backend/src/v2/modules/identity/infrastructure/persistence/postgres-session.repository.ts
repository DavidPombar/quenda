// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHash, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { SessionRepository } from "../../domain/session.repository";
import { Principal } from "../../../../shared/application/principal";
import { PrincipalRow, principalColumns, toPrincipal } from "./principal-row";
import { Database } from "../../../../shared/infrastructure/database";
function hash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
@Injectable()
export class PostgresSessionRepository extends SessionRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async findDemoUser(tenantId: string, role: "citizen" | "manager") {
    // Only demo accounts: real (eID, e-mail, local) accounts are never handed out without proof.
    const { rows } = await this.db.query<PrincipalRow>(
      `SELECT ${principalColumns} FROM users u WHERE u.tenant_id=$1 AND u.role=$2 AND u.assurance='demo' AND u.deleted_at IS NULL ORDER BY u.id LIMIT 1`,
      [tenantId, role],
    );
    return rows[0] ? toPrincipal(rows[0]) : null;
  }
  async createDemoUser(args: {
    id: string;
    tenantId: string;
    role: "citizen" | "manager";
    displayName: string;
  }) {
    await this.db.query(
      "INSERT INTO users (id,tenant_id,display_name,role) VALUES ($1,$2,$3,$4)",
      [args.id, args.tenantId, args.displayName, args.role],
    );
    return toPrincipal({
      userId: args.id,
      tenantId: args.tenantId,
      displayName: args.displayName,
      role: args.role,
      assurance: "demo",
    });
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
    const { rows } = await this.db.query<PrincipalRow>(
      `SELECT ${principalColumns} FROM sessions s JOIN users u ON u.id=s.user_id AND u.tenant_id=s.tenant_id WHERE s.token_hash=$1 AND s.expires_at>$2 AND u.deleted_at IS NULL`,
      [hash(token), now.toString()],
    );
    return rows[0] ? toPrincipal(rows[0]) : null;
  }
  async remove(token: string) {
    await this.db.query("DELETE FROM sessions WHERE token_hash=$1", [
      hash(token),
    ]);
  }
}
