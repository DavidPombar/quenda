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
import { SportRepository } from "./domain/sport.repository";
import { PostgresSportRepository } from "./infrastructure/persistence/postgres-sport.repository";
import { FacilityPhotoRepository } from "./domain/facility-photo.repository";
import { PostgresFacilityPhotoRepository } from "./infrastructure/persistence/postgres-facility-photo.repository";
import { FacilityDescriber } from "./application/facility-details";
import { GetFacility } from "./application/queries/get-facility.query";
import { GetFacilityPhoto } from "./application/queries/get-facility-photo.query";
import { ListManagedFacilities } from "./application/queries/list-managed-facilities.query";
import { ListSports } from "./application/queries/list-sports.query";
import { ListManagedSports } from "./application/queries/list-managed-sports.query";
import { GetMapSettings } from "./application/queries/get-map-settings.query";
import { SaveSport } from "./application/commands/save-sport.command";
import { AddFacilityPhoto } from "./application/commands/add-facility-photo.command";
import { UpdateFacilityPhoto } from "./application/commands/update-facility-photo.command";
import { RemoveFacilityPhoto } from "./application/commands/remove-facility-photo.command";
import { GetFacilityController } from "./infrastructure/api/public/get-facility.controller";
import { GetFacilityPhotoController } from "./infrastructure/api/public/get-facility-photo.controller";
import { ListSportsController } from "./infrastructure/api/public/list-sports.controller";
import { GetMapSettingsController } from "./infrastructure/api/public/get-map-settings.controller";
import { ListManagedFacilitiesController } from "./infrastructure/api/manager/list-managed-facilities.controller";
import { ListManagedSportsController } from "./infrastructure/api/manager/list-managed-sports.controller";
import { CreateSportController } from "./infrastructure/api/manager/create-sport.controller";
import { UpdateSportController } from "./infrastructure/api/manager/update-sport.controller";
import { AddFacilityPhotoController } from "./infrastructure/api/manager/add-facility-photo.controller";
import { UpdateFacilityPhotoController } from "./infrastructure/api/manager/update-facility-photo.controller";
import { RemoveFacilityPhotoController } from "./infrastructure/api/manager/remove-facility-photo.controller";
@Module({
  providers: [
    ListFacilities,
    ListCatalog,
    GetAvailability,
    SaveFacility,
    SaveFacilityResources,
    GetFacilityImpact,
    FacilityDescriber,
    GetFacility,
    GetFacilityPhoto,
    ListManagedFacilities,
    ListSports,
    ListManagedSports,
    GetMapSettings,
    SaveSport,
    AddFacilityPhoto,
    UpdateFacilityPhoto,
    RemoveFacilityPhoto,
    { provide: SportRepository, useClass: PostgresSportRepository },
    {
      provide: FacilityPhotoRepository,
      useClass: PostgresFacilityPhotoRepository,
    },
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
    ListManagedFacilitiesController,
    GetMapSettingsController,
    ListSportsController,
    GetFacilityPhotoController,
    GetFacilityController,
    ListManagedSportsController,
    CreateSportController,
    UpdateSportController,
    AddFacilityPhotoController,
    UpdateFacilityPhotoController,
    RemoveFacilityPhotoController,
  ],
  exports: [OpeningCalendar, HolidayCalendar, SportRepository],
})
export class FacilitiesModule {}
