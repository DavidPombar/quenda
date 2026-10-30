// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Facility } from "../domain/facility.entity";
import { FacilityDetails } from "../domain/facility.read-model";
import { ResourceRepository } from "../domain/resource.repository";
import { SportRepository } from "../domain/sport.repository";
import { FacilityPhotoRepository } from "../domain/facility-photo.repository";
/** Adds courts, sport names and photos to facilities of one municipality. */
@Injectable()
export class FacilityDescriber {
  constructor(
    private readonly resources: ResourceRepository,
    private readonly sports: SportRepository,
    private readonly photos: FacilityPhotoRepository,
  ) {}
  async describe(
    tenantId: string,
    facilities: readonly Facility[],
  ): Promise<FacilityDetails[]> {
    if (!facilities.length) return [];
    const ids = facilities.map((facility) => facility.id);
    const [resources, sports, photos] = await Promise.all([
      facilities.length === 1
        ? this.resources.listByFacility(tenantId, ids[0])
        : this.resources.listByTenant(tenantId),
      this.sports.list(tenantId),
      this.photos.list(tenantId, ids),
    ]);
    return facilities.map((facility) => ({
      ...facility,
      resources: resources.filter(
        (resource) => resource.facilityId === facility.id,
      ),
      sportName: sports.find((sport) => sport.code === facility.sport)
        ?.name ?? { gl: facility.sport, es: facility.sport },
      photos: photos.filter((photo) => photo.facilityId === facility.id),
    }));
  }
}
