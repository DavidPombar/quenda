// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import type { Temporal } from "@js-temporal/polyfill";
import {
  CitizenProfile,
  ExternalIdentityRepository,
} from "../../domain/external-identity.repository";
import { Database } from "../../../../shared/infrastructure/database";
import { PrincipalRow, principalColumns, toPrincipal } from "./principal-row";
@Injectable()
export class PostgresExternalIdentityRepository extends ExternalIdentityRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async findUser(tenantId: string, issuer: string, subject: string) {
    const { rows } = await this.db.query<PrincipalRow>(
      `SELECT ${principalColumns} FROM identities i JOIN users u ON u.tenant_id=i.tenant_id AND u.id=i.user_id
       WHERE i.tenant_id=$1 AND i.issuer=$2 AND i.subject=$3 AND u.deleted_at IS NULL FOR UPDATE OF u`,
      [tenantId, issuer, subject],
    );
    return rows[0] ? toPrincipal(rows[0]) : null;
  }
  async createCitizen(args: {
    id: string;
    tenantId: string;
    profile: CitizenProfile;
  }) {
    await this.db.query(
      "INSERT INTO users (id,tenant_id,display_name,role,email,assurance) VALUES ($1,$2,$3,'citizen',$4,$5)",
      [
        args.id,
        args.tenantId,
        args.profile.displayName,
        args.profile.email,
        args.profile.assurance,
      ],
    );
    return toPrincipal({
      userId: args.id,
      tenantId: args.tenantId,
      displayName: args.profile.displayName,
      role: "citizen",
      assurance: args.profile.assurance,
    });
  }
  async updateCitizen(
    tenantId: string,
    userId: string,
    profile: CitizenProfile,
  ) {
    const { rows } = await this.db.query<PrincipalRow>(
      `UPDATE users u SET display_name=$3, email=COALESCE($4, u.email), assurance=$5
       WHERE u.tenant_id=$1 AND u.id=$2 RETURNING ${principalColumns}`,
      [tenantId, userId, profile.displayName, profile.email, profile.assurance],
    );
    return toPrincipal(rows[0]);
  }
  async link(args: {
    id: string;
    tenantId: string;
    userId: string;
    issuer: string;
    subject: string;
    createdAt: Temporal.Instant;
  }) {
    await this.db.query(
      "INSERT INTO identities (id,tenant_id,user_id,issuer,subject,created_at) VALUES ($1,$2,$3,$4,$5,$6)",
      [
        args.id,
        args.tenantId,
        args.userId,
        args.issuer,
        args.subject,
        args.createdAt.toString(),
      ],
    );
  }
  async setNif(
    tenantId: string,
    userId: string,
    nif: { ciphertext: string; digest: string } | null,
  ) {
    await this.db.query(
      "UPDATE users SET nif_ciphertext=$3, nif_digest=$4 WHERE tenant_id=$1 AND id=$2",
      [tenantId, userId, nif?.ciphertext ?? null, nif?.digest ?? null],
    );
  }
}
