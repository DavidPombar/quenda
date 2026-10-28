// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { OpenDataRepository } from "./domain/open-data.repository";
import { PostgresOpenDataRepository } from "./infrastructure/persistence/postgres-open-data.repository";
import { ListOpenFacilities } from "./application/queries/list-open-facilities.query";
import { GetOpenFacilitiesJsonController } from "./infrastructure/api/public/get-facilities-json.controller";
import { GetOpenFacilitiesCsvController } from "./infrastructure/api/public/get-facilities-csv.controller";
import { GetOpenFacilitiesGeoJsonController } from "./infrastructure/api/public/get-facilities-geojson.controller";
import { GetOpenDataCatalogJsonLdController } from "./infrastructure/api/public/get-catalog-jsonld.controller";
import { GetOpenDataCatalogRdfController } from "./infrastructure/api/public/get-catalog-rdf.controller";
import { GetOpenDataSchemaController } from "./infrastructure/api/public/get-open-data-schema.controller";
@Module({
  providers: [
    ListOpenFacilities,
    { provide: OpenDataRepository, useClass: PostgresOpenDataRepository },
  ],
  controllers: [
    GetOpenFacilitiesJsonController,
    GetOpenFacilitiesCsvController,
    GetOpenFacilitiesGeoJsonController,
    GetOpenDataCatalogJsonLdController,
    GetOpenDataCatalogRdfController,
    GetOpenDataSchemaController,
  ],
})
export class OpenDataModule {}
