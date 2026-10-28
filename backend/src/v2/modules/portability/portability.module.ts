// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { PortabilityRepository } from "./domain/portability.repository";
import { PostgresPortabilityRepository } from "./infrastructure/persistence/postgres-portability.repository";
import { ExportMunicipality } from "./application/commands/export-municipality.command";
import { ExportMunicipalityController } from "./infrastructure/api/manager/export-municipality.controller";
@Module({
  providers: [
    ExportMunicipality,
    { provide: PortabilityRepository, useClass: PostgresPortabilityRepository },
  ],
  controllers: [ExportMunicipalityController],
})
export class PortabilityModule {}
