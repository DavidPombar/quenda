// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { ConsentRepository } from "../../domain/consent.repository";
import { Database } from "../../../../shared/infrastructure/database";
@Injectable()
export class PostgresConsentRepository extends ConsentRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async add(args: Parameters<ConsentRepository["add"]>[0]) {
    await this.db.query(
      "INSERT INTO consents (id,tenant_id,user_id,legal_version,accepted_at) VALUES ($1,$2,$3,$4,$5)",
      [
        args.id,
        args.tenantId,
        args.userId,
        args.legalVersion,
        args.acceptedAt.toString(),
      ],
    );
  }
  async listByUser(tenantId: string, userId: string) {
    const { rows } = await this.db.query<{
      legalVersion: string;
      acceptedAt: string;
    }>(
      'SELECT legal_version AS "legalVersion", accepted_at AS "acceptedAt" FROM consents WHERE tenant_id=$1 AND user_id=$2 ORDER BY accepted_at DESC',
      [tenantId, userId],
    );
    return rows.map((row) => ({
      legalVersion: row.legalVersion,
      acceptedAt: Temporal.Instant.from(row.acceptedAt),
    }));
  }
}
