// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import {
  FacilityFilters,
  FacilityRepository,
  PageRequest,
} from "../../domain/facility.repository";
import { FacilityPage } from "../../domain/facility.read-model";
import { FacilityDescriber } from "../facility-details";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** One page of a municipality's catalogue, filtered on the server (C1, #26). */
@Injectable()
export class ListFacilities {
  constructor(
    private readonly facilities: FacilityRepository,
    private readonly describer: FacilityDescriber,
    private readonly municipalities: Municipalities,
  ) {}
  async execute(args: {
    slug: string;
    filters: FacilityFilters;
    page: PageRequest;
  }): Promise<Result<FacilityPage, AppError<"not_found">>> {
    const municipality = await this.municipalities.findBySlug(args.slug);
    if (!municipality) return Result.err(failure("not_found"));
    const found = await this.facilities.search(
      municipality.id,
      { ...args.filters, q: args.filters.q?.trim() || undefined },
      args.page,
    );
    return Result.ok({
      items: await this.describer.describe(municipality.id, found.items),
      total: found.total,
      page: args.page.page,
      pageSize: args.page.size,
    });
  }
}
