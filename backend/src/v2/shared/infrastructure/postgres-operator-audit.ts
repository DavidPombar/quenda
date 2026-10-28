// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Audit, AuditDetails } from "../application/audit";
import { Clock } from "../application/clock";
import { IdGenerator } from "../application/id-generator";
import { OperatorAudit } from "../application/operator-audit";
import { OperatorPrincipal } from "../application/operator-principal";
import { Database } from "./database";
@Injectable()
export class PostgresOperatorAudit extends OperatorAudit {
  constructor(
    private readonly db: Database,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly audit: Audit,
  ) {
    super();
  }
  async record(
    principal: OperatorPrincipal,
    action: string,
    resourceId: string,
    tenantId: string | null,
    details?: AuditDetails,
  ) {
    await this.db.query(
      "INSERT INTO operator_audit_events (id,actor_id,action,tenant_id,resource_id,occurred_at,details) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)",
      [
        this.ids.next(),
        principal.operatorId,
        action,
        tenantId,
        resourceId,
        this.clock.now().toString(),
        details === undefined ? null : JSON.stringify(details),
      ],
    );
    if (tenantId)
      await this.audit.recordSystem(tenantId, action, resourceId, {
        ...details,
        operator: {
          id: principal.operatorId,
          name: principal.displayName,
        },
      });
  }
}
