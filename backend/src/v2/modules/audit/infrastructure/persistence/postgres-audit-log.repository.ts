// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { Database } from "../../../../shared/infrastructure/database";
import {
  AuditLogFilter,
  AuditLogRepository,
} from "../../domain/audit-log.repository";
import { AuditEntry } from "../../domain/audit-entry.read-model";
type AuditRow = Omit<AuditEntry, "occurredAt"> & { occurredAt: string };
@Injectable()
export class PostgresAuditLogRepository extends AuditLogRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async list(tenantId: string, filter: AuditLogFilter) {
    // Served by audit_events_tenant_time (tenant_id, occurred_at DESC).
    const { rows } = await this.db.query<AuditRow>(
      `SELECT a.id, a.action, a.actor_id AS "actorId", a.actor_role AS "actorRole",
        u.display_name AS "actorName", a.resource_id AS "resourceId",
        a.occurred_at AS "occurredAt", a.details
      FROM audit_events a
      LEFT JOIN users u ON u.tenant_id=a.tenant_id AND u.id=a.actor_id
      WHERE a.tenant_id=$1
        AND ($2::timestamptz IS NULL OR a.occurred_at>=$2::timestamptz)
        AND ($3::timestamptz IS NULL OR a.occurred_at<$3::timestamptz)
        AND ($4::text IS NULL OR a.action=$4::text)
      ORDER BY a.occurred_at DESC, a.id
      LIMIT $5`,
      [
        tenantId,
        filter.from?.toString() ?? null,
        filter.to?.toString() ?? null,
        filter.action ?? null,
        filter.limit,
      ],
    );
    return rows.map((row): AuditEntry => ({
      ...row,
      occurredAt: Temporal.Instant.from(row.occurredAt),
    }));
  }
}
