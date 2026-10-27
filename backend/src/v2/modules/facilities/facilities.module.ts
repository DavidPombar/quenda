// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { FacilityRepository } from "./domain/facility.repository";
import { OpeningCalendar } from "./domain/opening-calendar";
import { PostgresFacilityRepository } from "./infrastructure/persistence/postgres-facility.repository";
import { IcalOpeningCalendar } from "./infrastructure/calendar/ical-opening-calendar";
import { HolidayCalendar } from "./domain/holiday-calendar";
import { IcalHolidayCalendar } from "./infrastructure/calendar/ical-holiday-calendar";
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
    { provide: OpeningCalendar, useClass: IcalOpeningCalendar },
    { provide: HolidayCalendar, useClass: IcalHolidayCalendar },
  ],
  controllers: [
    ListFacilitiesController,
    GetAvailabilityController,
    CreateFacilityController,
    UpdateFacilityController,
  ],
  exports: [OpeningCalendar, HolidayCalendar],
})
export class FacilitiesModule {}
