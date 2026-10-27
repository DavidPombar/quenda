// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { FacilitiesModule } from "../facilities/facilities.module";
import { MunicipalitySettingsRepository } from "./domain/municipality-settings.repository";
import { PostgresMunicipalitySettingsRepository } from "./infrastructure/persistence/postgres-municipality-settings.repository";
import { ListMunicipalities } from "./application/queries/list-municipalities.query";
import { GetMunicipalitySettings } from "./application/queries/get-municipality-settings.query";
import { GetMunicipalityLogo } from "./application/queries/get-municipality-logo.query";
import { UpdateMunicipalitySettings } from "./application/commands/update-municipality-settings.command";
import { UploadMunicipalityLogo } from "./application/commands/upload-municipality-logo.command";
import { DeleteMunicipalityLogo } from "./application/commands/delete-municipality-logo.command";
import { ListMunicipalitiesController } from "./infrastructure/api/public/list-municipalities.controller";
import { GetMunicipalityLogoController } from "./infrastructure/api/public/get-municipality-logo.controller";
import { GetMunicipalitySettingsController } from "./infrastructure/api/manager/get-municipality-settings.controller";
import { UpdateMunicipalitySettingsController } from "./infrastructure/api/manager/update-municipality-settings.controller";
import { UploadMunicipalityLogoController } from "./infrastructure/api/manager/upload-municipality-logo.controller";
import { DeleteMunicipalityLogoController } from "./infrastructure/api/manager/delete-municipality-logo.controller";
@Module({
  imports: [FacilitiesModule],
  providers: [
    ListMunicipalities,
    GetMunicipalitySettings,
    GetMunicipalityLogo,
    UpdateMunicipalitySettings,
    UploadMunicipalityLogo,
    DeleteMunicipalityLogo,
    {
      provide: MunicipalitySettingsRepository,
      useClass: PostgresMunicipalitySettingsRepository,
    },
  ],
  controllers: [
    ListMunicipalitiesController,
    GetMunicipalityLogoController,
    GetMunicipalitySettingsController,
    UpdateMunicipalitySettingsController,
    UploadMunicipalityLogoController,
    DeleteMunicipalityLogoController,
  ],
})
export class MunicipalitiesModule {}
