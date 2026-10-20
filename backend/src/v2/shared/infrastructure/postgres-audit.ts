// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Audit, AuditDetails } from "../application/audit";
import { Clock } from "../application/clock";
import { IdGenerator } from "../application/id-generator";
import { Principal } from "../application/principal";
import { Database } from "./database";
@Injectable()
export class PostgresAudit extends Audit {
  constructor(
    private readonly db: Database,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {
    super();
  }
  async record(
    principal: Principal,
    action: string,
    resourceId: string,
    details?: AuditDetails,
  ) {
    await this.db.query(
      "INSERT INTO audit_events (id,tenant_id,actor_id,actor_role,action,resource_id,occurred_at,details) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)",
      [
        this.ids.next(),
        principal.tenantId,
        principal.userId,
        principal.role,
        action,
        resourceId,
        this.clock.now().toString(),
        details === undefined ? null : JSON.stringify(details),
      ],
    );
  }
}
