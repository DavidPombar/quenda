// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { FacilitiesModule } from "../facilities/facilities.module";
import { InsightsRepository } from "./domain/insights.repository";
import { PostgresInsightsRepository } from "./infrastructure/persistence/postgres-insights.repository";
import { GetInsights } from "./application/queries/get-insights.query";
import { MunicipalityInsights } from "./application/municipality-insights";
import { GetInsightsController } from "./infrastructure/api/manager/get-insights.controller";
import { ExportInsightsController } from "./infrastructure/api/manager/export-insights.controller";
import { OccupancyHistory } from "./application/occupancy-history";
import { SuggestSlots } from "./application/queries/suggest-slots.query";
import { SuggestSlotsController } from "./infrastructure/api/public/suggest-slots.controller";
import {
  HistoricalOccupancyRecommender,
  Recommender,
} from "./domain/slot-recommender";
@Module({
  imports: [FacilitiesModule],
  providers: [
    GetInsights,
    MunicipalityInsights,
    OccupancyHistory,
    SuggestSlots,
    { provide: Recommender, useClass: HistoricalOccupancyRecommender },
    { provide: InsightsRepository, useClass: PostgresInsightsRepository },
  ],
  controllers: [
    GetInsightsController,
    ExportInsightsController,
    SuggestSlotsController,
  ],
  exports: [MunicipalityInsights],
})
export class InsightsModule {}
