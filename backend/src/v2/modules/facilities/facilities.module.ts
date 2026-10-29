// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { FacilityRepository } from "./domain/facility.repository";
import { OpeningCalendar } from "./domain/opening-calendar";
import { ResourceRepository } from "./domain/resource.repository";
import { PostgresResourceRepository } from "./infrastructure/persistence/postgres-resource.repository";
import { PostgresFacilityRepository } from "./infrastructure/persistence/postgres-facility.repository";
import { IcalOpeningCalendar } from "./infrastructure/calendar/ical-opening-calendar";
import { HolidayCalendar } from "./domain/holiday-calendar";
import { IcalHolidayCalendar } from "./infrastructure/calendar/ical-holiday-calendar";
import { ListFacilities } from "./application/queries/list-facilities.query";
import { ListCatalog } from "./application/queries/list-catalog.query";
import { ListCatalogController } from "./infrastructure/api/public/list-catalog.controller";
import { GetAvailability } from "./application/queries/get-availability.query";
import { SaveFacility } from "./application/commands/save-facility.command";
import { SaveFacilityResources } from "./application/commands/save-facility-resources.command";
import { SaveFacilityResourcesController } from "./infrastructure/api/manager/save-facility-resources.controller";
import { ListFacilitiesController } from "./infrastructure/api/public/list-facilities.controller";
import { GetAvailabilityController } from "./infrastructure/api/public/get-availability.controller";
import { CreateFacilityController } from "./infrastructure/api/manager/create-facility.controller";
import { UpdateFacilityController } from "./infrastructure/api/manager/update-facility.controller";
import { GetFacilityImpact } from "./application/queries/get-facility-impact.query";
import { GetFacilityImpactController } from "./infrastructure/api/manager/get-facility-impact.controller";
@Module({
  providers: [
    ListFacilities,
    ListCatalog,
    GetAvailability,
    SaveFacility,
    SaveFacilityResources,
    GetFacilityImpact,
    { provide: FacilityRepository, useClass: PostgresFacilityRepository },
    { provide: ResourceRepository, useClass: PostgresResourceRepository },
    { provide: OpeningCalendar, useClass: IcalOpeningCalendar },
    { provide: HolidayCalendar, useClass: IcalHolidayCalendar },
  ],
  controllers: [
    ListFacilitiesController,
    ListCatalogController,
    GetAvailabilityController,
    CreateFacilityController,
    UpdateFacilityController,
    SaveFacilityResourcesController,
    GetFacilityImpactController,
  ],
  exports: [OpeningCalendar, HolidayCalendar],
})
export class FacilitiesModule {}
