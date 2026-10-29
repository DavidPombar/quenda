// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { FacilityRepository } from "../../domain/facility.repository";
import { ResourceRepository } from "../../domain/resource.repository";
import { Resource } from "../../domain/resource.entity";
import { ResourceDraft, planResources } from "../../domain/resource-plan";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type SaveFacilityResourcesError =
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"validation">
  | AppError<"id_reused">
  | AppError<"resource_in_use">
  | AppError<"resource_has_history">;
const audited = (
  resource: Pick<Resource, "id" | "name" | "parentId" | "active">,
) => ({
  id: resource.id,
  name: resource.name,
  parentId: resource.parentId,
  active: resource.active,
});
/** Replaces the complete set of courts and spaces of a facility (M1). */
@Injectable()
export class SaveFacilityResources {
  constructor(
    private readonly facilities: FacilityRepository,
    private readonly resources: ResourceRepository,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    facilityId: string;
    resources: ResourceDraft[];
  }): Promise<Result<Resource[], SaveFacilityResourcesError>> {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const { tenantId } = args.principal;
    // The facility lock also serialises this change with reservations of the facility.
    const facility = await this.facilities.find(
      tenantId,
      args.facilityId,
      true,
    );
    if (!facility) return Result.err(failure("not_found"));
    const current = await this.resources.listByFacility(
      tenantId,
      args.facilityId,
    );
    if (
      (
        await this.resources.foreignIds(
          tenantId,
          args.facilityId,
          args.resources.map((resource) => resource.id),
        )
      ).length
    )
      return Result.err(failure("id_reused"));
    const result = planResources(
      current,
      args.resources,
      await this.resources.usage(tenantId, args.facilityId, this.clock.now()),
    );
    if ("error" in result) return Result.err(failure(result.error.code));
    await this.resources.apply(tenantId, args.facilityId, result.plan);
    const saved = await this.resources.listByFacility(
      tenantId,
      args.facilityId,
    );
    await this.audit.record(
      args.principal,
      "facility.resources_updated",
      args.facilityId,
      { before: current.map(audited), after: saved.map(audited) },
    );
    return Result.ok(saved);
  }
}
