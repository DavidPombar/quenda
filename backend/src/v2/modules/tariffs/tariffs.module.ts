// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { UserCategoryRepository } from "./domain/user-category.repository";
import { FacilityPrices } from "./domain/facility-prices";
import { PostgresUserCategoryRepository } from "./infrastructure/persistence/postgres-user-category.repository";
import { PostgresFacilityPrices } from "./infrastructure/persistence/postgres-facility-prices";
import { TariffResolver } from "./application/tariff-resolver";
import { GetMyCategories } from "./application/queries/get-my-categories.query";
import { GetTariff } from "./application/queries/get-tariff.query";
import { ListCategoryRequests } from "./application/queries/list-category-requests.query";
import { SearchCitizens } from "./application/queries/search-citizens.query";
import { RequestCategory } from "./application/commands/request-category.command";
import { SetFamilyPreference } from "./application/commands/set-family-preference.command";
import { DecideCategory } from "./application/commands/decide-category.command";
import { RevokeCategory } from "./application/commands/revoke-category.command";
import { GetMyCategoriesController } from "./infrastructure/api/citizen/get-my-categories.controller";
import { RequestCategoryController } from "./infrastructure/api/citizen/request-category.controller";
import { SetFamilyPreferenceController } from "./infrastructure/api/citizen/set-family-preference.controller";
import { GetTariffController } from "./infrastructure/api/citizen/get-tariff.controller";
import { ListCategoryRequestsController } from "./infrastructure/api/manager/list-category-requests.controller";
import { SearchCitizensController } from "./infrastructure/api/manager/search-citizens.controller";
import { DecideCategoryController } from "./infrastructure/api/manager/decide-category.controller";
import { RevokeCategoryController } from "./infrastructure/api/manager/revoke-category.controller";
/** User categories and the tariff each person pays per facility (M2, R2). */
@Module({
  providers: [
    TariffResolver,
    GetMyCategories,
    GetTariff,
    ListCategoryRequests,
    SearchCitizens,
    RequestCategory,
    SetFamilyPreference,
    DecideCategory,
    RevokeCategory,
    {
      provide: UserCategoryRepository,
      useClass: PostgresUserCategoryRepository,
    },
    { provide: FacilityPrices, useClass: PostgresFacilityPrices },
  ],
  controllers: [
    GetMyCategoriesController,
    RequestCategoryController,
    SetFamilyPreferenceController,
    GetTariffController,
    ListCategoryRequestsController,
    SearchCitizensController,
    DecideCategoryController,
    RevokeCategoryController,
  ],
  exports: [TariffResolver],
})
export class TariffsModule {}
