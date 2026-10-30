// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { RecordPageView } from "./application/commands/record-page-view.command";
import { RecordPageViewController } from "./infrastructure/api/public/record-page-view.controller";
@Module({
  providers: [RecordPageView],
  controllers: [RecordPageViewController],
})
export class AnalyticsModule {}
