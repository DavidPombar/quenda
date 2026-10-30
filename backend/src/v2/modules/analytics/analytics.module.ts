// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { InsightsModule } from "../insights/insights.module";
import { RecordPageView } from "./application/commands/record-page-view.command";
import { GetWebAnalytics } from "./application/queries/get-web-analytics.query";
import { AnalyticsReader } from "./application/analytics-reader";
import { UmamiApiReader } from "./infrastructure/umami/umami-api-reader";
import { RecordPageViewController } from "./infrastructure/api/public/record-page-view.controller";
import { GetWebAnalyticsStatusController } from "./infrastructure/api/public/get-web-analytics-status.controller";
import { GetDeploymentWebAnalyticsController } from "./infrastructure/api/operator/get-deployment-web-analytics.controller";
import { GetWebAnalyticsController } from "./infrastructure/api/manager/get-web-analytics.controller";
@Module({
  imports: [InsightsModule],
  providers: [
    RecordPageView,
    GetWebAnalytics,
    { provide: AnalyticsReader, useClass: UmamiApiReader },
  ],
  controllers: [
    RecordPageViewController,
    GetWebAnalyticsStatusController,
    GetDeploymentWebAnalyticsController,
    GetWebAnalyticsController,
  ],
})
export class AnalyticsModule {}
