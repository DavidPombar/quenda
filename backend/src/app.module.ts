// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { SharedModule } from "./v2/shared/shared.module";
import { IdentityModule } from "./v2/modules/identity/identity.module";
import { MunicipalitiesModule } from "./v2/modules/municipalities/municipalities.module";
import { FacilitiesModule } from "./v2/modules/facilities/facilities.module";
import { BookingsModule } from "./v2/modules/bookings/bookings.module";
import { InsightsModule } from "./v2/modules/insights/insights.module";
@Module({
  imports: [
    SharedModule,
    IdentityModule,
    MunicipalitiesModule,
    FacilitiesModule,
    BookingsModule,
    InsightsModule,
  ],
})
export class AppModule {}
