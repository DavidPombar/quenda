// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { RetentionRepository } from "./domain/retention.repository";
import { PostgresRetentionRepository } from "./infrastructure/persistence/postgres-retention.repository";
import { ApplyRetention } from "./application/commands/apply-retention.command";
@Module({
  providers: [
    ApplyRetention,
    { provide: RetentionRepository, useClass: PostgresRetentionRepository },
  ],
})
export class RetentionModule {}
