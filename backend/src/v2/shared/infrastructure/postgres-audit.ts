// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Audit } from "../application/audit";
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
  async record(principal: Principal, action: string, resourceId: string) {
    await this.db.query("INSERT INTO audit_events VALUES ($1,$2,$3,$4,$5,$6)", [
      this.ids.next(),
      principal.tenantId,
      principal.userId,
      action,
      resourceId,
      this.clock.now().toString(),
    ]);
  }
}
