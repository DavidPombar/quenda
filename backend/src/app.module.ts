// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { SharedModule } from "./v2/shared/shared.module";
import { RateLimitModule } from "./v2/shared/infrastructure/api/rate-limit";
import { IdentityModule } from "./v2/modules/identity/identity.module";
import { MunicipalitiesModule } from "./v2/modules/municipalities/municipalities.module";
import { FacilitiesModule } from "./v2/modules/facilities/facilities.module";
import { BookingsModule } from "./v2/modules/bookings/bookings.module";
import { InsightsModule } from "./v2/modules/insights/insights.module";
import { AccountModule } from "./v2/modules/account/account.module";
import { AuditModule } from "./v2/modules/audit/audit.module";
import { RetentionModule } from "./v2/modules/retention/retention.module";
import { NotificationsModule } from "./v2/modules/notifications/notifications.module";
@Module({
  imports: [
    SharedModule,
    RateLimitModule,
    IdentityModule,
    MunicipalitiesModule,
    FacilitiesModule,
    BookingsModule,
    InsightsModule,
    AccountModule,
    AuditModule,
    RetentionModule,
    NotificationsModule,
  ],
})
export class AppModule {}
