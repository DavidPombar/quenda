// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { FacilityRepository } from "../../domain/facility.repository";
import { ResourceRepository } from "../../domain/resource.repository";
import { FacilityDetails } from "../../domain/facility.read-model";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Result } from "../../../../shared/application/result";
import { failure } from "../../../../shared/application/errors";
@Injectable()
export class ListFacilities {
  constructor(
    private readonly facilities: FacilityRepository,
    private readonly resources: ResourceRepository,
    private readonly municipalities: Municipalities,
  ) {}
  async execute(args: { slug: string }) {
    const municipality = await this.municipalities.findBySlug(args.slug);
    if (!municipality) return Result.err(failure("not_found"));
    const resources = await this.resources.listByTenant(municipality.id);
    return Result.ok(
      (await this.facilities.list(municipality.id)).map(
        (facility): FacilityDetails => ({
          ...facility,
          resources: resources.filter(
            (resource) => resource.facilityId === facility.id,
          ),
        }),
      ),
    );
  }
}
