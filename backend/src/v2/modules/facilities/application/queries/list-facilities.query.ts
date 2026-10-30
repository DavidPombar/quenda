// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { FacilityRepository } from "../../domain/facility.repository";
import { ResourceRepository } from "../../domain/resource.repository";
import { FacilityDetails } from "../../domain/facility.read-model";
import { SportRepository } from "../../domain/sport.repository";
import { sportLabel } from "../../domain/sport-label";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Result } from "../../../../shared/application/result";
import { failure } from "../../../../shared/application/errors";
@Injectable()
export class ListFacilities {
  constructor(
    private readonly facilities: FacilityRepository,
    private readonly resources: ResourceRepository,
    private readonly municipalities: Municipalities,
    private readonly sports: SportRepository,
  ) {}
  async execute(args: { slug: string }) {
    const municipality = await this.municipalities.findBySlug(args.slug);
    if (!municipality) return Result.err(failure("not_found"));
    const resources = await this.resources.listByTenant(municipality.id);
    const sports = await this.sports.list(municipality.id, true);
    return Result.ok(
      (await this.facilities.list(municipality.id)).map(
        (facility): FacilityDetails => ({
          ...facility,
          ...sportLabel(
            sports.find((sport) => sport.code === facility.sport) ?? null,
            facility.sport,
          ),
          resources: resources.filter(
            (resource) => resource.facilityId === facility.id,
          ),
        }),
      ),
    );
  }
}
