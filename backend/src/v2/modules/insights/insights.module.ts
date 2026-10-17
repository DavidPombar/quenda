// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { FacilitiesModule } from "../facilities/facilities.module";
import { InsightsRepository } from "./domain/insights.repository";
import { PostgresInsightsRepository } from "./infrastructure/persistence/postgres-insights.repository";
import { GetInsights } from "./application/queries/get-insights.query";
import { GetInsightsController } from "./infrastructure/api/manager/get-insights.controller";
@Module({
  imports: [FacilitiesModule],
  providers: [
    GetInsights,
    { provide: InsightsRepository, useClass: PostgresInsightsRepository },
  ],
  controllers: [GetInsightsController],
})
export class InsightsModule {}
