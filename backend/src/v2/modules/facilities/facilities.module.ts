// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { FacilityRepository } from "./domain/facility.repository";
import { OpeningCalendar } from "./domain/opening-calendar";
import { ResourceRepository } from "./domain/resource.repository";
import { PostgresResourceRepository } from "./infrastructure/persistence/postgres-resource.repository";
import { PostgresFacilityRepository } from "./infrastructure/persistence/postgres-facility.repository";
import { IcalOpeningCalendar } from "./infrastructure/calendar/ical-opening-calendar";
import { ListFacilities } from "./application/queries/list-facilities.query";
import { GetAvailability } from "./application/queries/get-availability.query";
import { SaveFacility } from "./application/commands/save-facility.command";
import { ListFacilitiesController } from "./infrastructure/api/public/list-facilities.controller";
import { GetAvailabilityController } from "./infrastructure/api/public/get-availability.controller";
import { CreateFacilityController } from "./infrastructure/api/manager/create-facility.controller";
import { UpdateFacilityController } from "./infrastructure/api/manager/update-facility.controller";
@Module({
  providers: [
    ListFacilities,
    GetAvailability,
    SaveFacility,
    { provide: FacilityRepository, useClass: PostgresFacilityRepository },
    { provide: ResourceRepository, useClass: PostgresResourceRepository },
    { provide: OpeningCalendar, useClass: IcalOpeningCalendar },
  ],
  controllers: [
    ListFacilitiesController,
    GetAvailabilityController,
    CreateFacilityController,
    UpdateFacilityController,
  ],
  exports: [OpeningCalendar],
})
export class FacilitiesModule {}
