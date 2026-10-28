// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import {
  CatalogEntry,
  CatalogFilters,
  FacilityRepository,
} from "../../domain/facility.repository";
import { Result } from "../../../../shared/application/result";
/** Facilities of every municipality in the deployment, for citizens looking around (#18). */
@Injectable()
export class ListCatalog {
  constructor(private readonly facilities: FacilityRepository) {}
  async execute(
    filters: CatalogFilters,
  ): Promise<Result<CatalogEntry[], never>> {
    return Result.ok(
      await this.facilities.catalog({
        ...filters,
        q: filters.q?.trim() || undefined,
      }),
    );
  }
}
