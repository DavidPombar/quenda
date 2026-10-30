// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import {
  Credential,
  CredentialRepository,
  Realm,
  StaffAccount,
  TicketStep,
} from "../../domain/credential.repository";
import { Database } from "../../../../shared/infrastructure/database";
import { PrincipalRow, principalColumns, toPrincipal } from "./principal-row";
const columns = `id, realm, tenant_id AS "tenantId", subject_id AS "subjectId", login,
  password_hash AS "passwordHash", must_change_password AS "mustChangePassword",
  totp_secret AS "totpSecret", totp_confirmed_at AS "totpConfirmedAt",
  totp_last_step AS "totpLastStep", failed_attempts AS "failedAttempts",
  locked_until AS "lockedUntil", disabled_at AS "disabledAt"`;
type Row = Omit<
  Credential,
  "totpConfirmedAt" | "lockedUntil" | "disabledAt" | "totpLastStep"
> & {
  totpConfirmedAt: string | null;
  lockedUntil: string | null;
  disabledAt: string | null;
  totpLastStep: string | null;
};
const instant = (value: string | null) =>
  value === null ? null : Temporal.Instant.from(value);
function toCredential(row: Row): Credential {
  return {
    ...row,
    totpConfirmedAt: instant(row.totpConfirmedAt),
    lockedUntil: instant(row.lockedUntil),
    disabledAt: instant(row.disabledAt),
    totpLastStep: row.totpLastStep === null ? null : Number(row.totpLastStep),
  };
}
@Injectable()
export class PostgresCredentialRepository extends CredentialRepository {
  constructor(private readonly db: Database) {
    super();
  }
  private async one(sql: string, values: unknown[]) {
    const { rows } = await this.db.query<Row>(sql, values);
    return rows[0] ? toCredential(rows[0]) : null;
  }
  findByLogin(realm: Realm, tenantId: string | null, login: string) {
    return this.one(
      `SELECT ${columns} FROM credentials WHERE realm=$1 AND tenant_id IS NOT DISTINCT FROM $2 AND login=$3 FOR UPDATE`,
      [realm, tenantId, login],
    );
  }
  findById(id: string) {
    return this.one(
      `SELECT ${columns} FROM credentials WHERE id=$1 FOR UPDATE`,
      [id],
    );
  }
  findBySubject(realm: Realm, subjectId: string) {
    return this.one(
      `SELECT ${columns} FROM credentials WHERE realm=$1 AND subject_id=$2 FOR UPDATE`,
      [realm, subjectId],
    );
  }
  async loginTaken(realm: Realm, tenantId: string | null, login: string) {
    return Boolean(
      (
        await this.db.query(
          "SELECT 1 FROM credentials WHERE realm=$1 AND tenant_id IS NOT DISTINCT FROM $2 AND login=$3",
          [realm, tenantId, login],
        )
      ).rowCount,
    );
  }
  async create(args: Parameters<CredentialRepository["create"]>[0]) {
    await this.db.query(
      `INSERT INTO credentials (id,realm,tenant_id,subject_id,login,password_hash,created_at,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$7)`,
      [
        args.id,
        args.realm,
        args.tenantId,
        args.subjectId,
        args.login,
        args.passwordHash,
        args.at.toString(),
      ],
    );
  }
  async recordFailure(id: string, lockedUntil: Temporal.Instant | null) {
    await this.db.query(
      lockedUntil
        ? "UPDATE credentials SET failed_attempts=0, locked_until=$2 WHERE id=$1"
        : "UPDATE credentials SET failed_attempts=failed_attempts+1 WHERE id=$1",
      lockedUntil ? [id, lockedUntil.toString()] : [id],
    );
  }
  async clearFailures(id: string) {
    await this.db.query(
      "UPDATE credentials SET failed_attempts=0, locked_until=NULL WHERE id=$1",
      [id],
    );
  }
  async setPassword(
    id: string,
    hash: string,
    mustChange: boolean,
    at: Temporal.Instant,
  ) {
    await this.db.query(
      "UPDATE credentials SET password_hash=$2, must_change_password=$3, updated_at=$4 WHERE id=$1",
      [id, hash, mustChange, at.toString()],
    );
  }
  async setTotpSecret(id: string, secret: string, at: Temporal.Instant) {
    await this.db.query(
      "UPDATE credentials SET totp_secret=$2, totp_confirmed_at=NULL, totp_last_step=NULL, updated_at=$3 WHERE id=$1",
      [id, secret, at.toString()],
    );
  }
  async acceptTotp(id: string, step: number, at: Temporal.Instant) {
    await this.db.query(
      "UPDATE credentials SET totp_last_step=$2, totp_confirmed_at=COALESCE(totp_confirmed_at, $3), failed_attempts=0, locked_until=NULL WHERE id=$1",
      [id, step, at.toString()],
    );
  }
  async reset(id: string, hash: string, at: Temporal.Instant) {
    await this.db.query(
      `UPDATE credentials SET password_hash=$2, must_change_password=true, totp_secret=NULL,
        totp_confirmed_at=NULL, totp_last_step=NULL, failed_attempts=0, locked_until=NULL,
        updated_at=$3 WHERE id=$1`,
      [id, hash, at.toString()],
    );
    await this.dropTickets(id);
  }
  async setDisabled(id: string, at: Temporal.Instant | null) {
    await this.db.query(
      "UPDATE credentials SET disabled_at=$2, updated_at=COALESCE($2, now()) WHERE id=$1",
      [id, at?.toString() ?? null],
    );
    if (at) await this.dropTickets(id);
  }
  async saveTicket(args: {
    ticketHash: string;
    credentialId: string;
    step: TicketStep;
    expiresAt: Temporal.Instant;
  }) {
    await this.db.query(
      "INSERT INTO login_tickets (ticket_hash,credential_id,step,expires_at) VALUES ($1,$2,$3,$4)",
      [
        args.ticketHash,
        args.credentialId,
        args.step,
        args.expiresAt.toString(),
      ],
    );
  }
  async takeTicket(ticketHash: string, now: Temporal.Instant) {
    const { rows } = await this.db.query<{
      credentialId: string;
      step: TicketStep;
      expiresAt: string;
    }>(
      'DELETE FROM login_tickets WHERE ticket_hash=$1 RETURNING credential_id AS "credentialId", step, expires_at AS "expiresAt"',
      [ticketHash],
    );
    const row = rows[0];
    if (
      !row ||
      Temporal.Instant.compare(Temporal.Instant.from(row.expiresAt), now) <= 0
    )
      return null;
    return {
      credentialId: row.credentialId,
      step: row.step,
      expiresAt: Temporal.Instant.from(row.expiresAt),
    };
  }
  async dropTickets(credentialId: string) {
    await this.db.query("DELETE FROM login_tickets WHERE credential_id=$1", [
      credentialId,
    ]);
  }
  async tenantPrincipal(tenantId: string, userId: string) {
    const { rows } = await this.db.query<PrincipalRow>(
      `SELECT ${principalColumns} FROM users u WHERE u.tenant_id=$1 AND u.id=$2 AND u.deleted_at IS NULL`,
      [tenantId, userId],
    );
    return rows[0] ? toPrincipal(rows[0]) : null;
  }
  async operatorPrincipal(operatorId: string) {
    const { rows } = await this.db.query<{
      operatorId: string;
      displayName: string;
    }>(
      'SELECT id AS "operatorId", display_name AS "displayName" FROM operators WHERE id=$1 AND deleted_at IS NULL',
      [operatorId],
    );
    return rows[0]
      ? {
          ...rows[0],
          grants: ["deployment:manage", "deployment:insights"] as const,
        }
      : null;
  }
  async markLocal(tenantId: string, userId: string) {
    await this.db.query(
      "UPDATE users SET assurance='local' WHERE tenant_id=$1 AND id=$2",
      [tenantId, userId],
    );
  }
  async staff(tenantId: string) {
    const { rows } = await this.db.query<StaffAccount>(
      `SELECT u.id AS "userId", u.display_name AS "displayName", u.role, c.login,
        c.totp_confirmed_at IS NOT NULL AS enrolled, c.disabled_at IS NOT NULL AS disabled
      FROM users u LEFT JOIN credentials c ON c.realm='tenant' AND c.tenant_id=u.tenant_id AND c.subject_id=u.id
      WHERE u.tenant_id=$1 AND u.role IN ('manager','access') AND u.deleted_at IS NULL
      ORDER BY u.role DESC, u.display_name, u.id`,
      [tenantId],
    );
    return rows;
  }
  async createStaffUser(args: {
    id: string;
    tenantId: string;
    displayName: string;
    role: "manager" | "access";
  }) {
    await this.db.query(
      "INSERT INTO users (id,tenant_id,display_name,role,assurance) VALUES ($1,$2,$3,$4,'local')",
      [args.id, args.tenantId, args.displayName, args.role],
    );
  }
  async createOperator(id: string, displayName: string) {
    await this.db.query(
      "INSERT INTO operators (id, display_name) VALUES ($1, $2)",
      [id, displayName],
    );
  }
  async revokeSessions(realm: Realm, subjectId: string) {
    await this.db.query(
      realm === "tenant"
        ? "DELETE FROM sessions WHERE user_id=$1"
        : "DELETE FROM operator_sessions WHERE operator_id=$1",
      [subjectId],
    );
  }
}
