// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { ListMunicipalities } from "./application/queries/list-municipalities.query";
import { ListMunicipalitiesController } from "./infrastructure/api/public/list-municipalities.controller";
@Module({
  providers: [ListMunicipalities],
  controllers: [ListMunicipalitiesController],
})
export class MunicipalitiesModule {}
