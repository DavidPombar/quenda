// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { AuditLogRepository } from "./domain/audit-log.repository";
import { PostgresAuditLogRepository } from "./infrastructure/persistence/postgres-audit-log.repository";
import { ListAudit } from "./application/queries/list-audit.query";
import { ListAuditController } from "./infrastructure/api/manager/list-audit.controller";
@Module({
  providers: [
    ListAudit,
    { provide: AuditLogRepository, useClass: PostgresAuditLogRepository },
  ],
  controllers: [ListAuditController],
})
export class AuditModule {}
