// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { FacilityRepository } from "../../domain/facility.repository";
import { FacilityDetails } from "../../domain/facility.read-model";
import { FacilityDescriber } from "../facility-details";
import { Principal, can } from "../../../../shared/application/principal";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** Every facility of the manager's municipality, for the backoffice (unpaginated). */
@Injectable()
export class ListManagedFacilities {
  constructor(
    private readonly facilities: FacilityRepository,
    private readonly describer: FacilityDescriber,
  ) {}
  async execute(args: {
    principal: Principal;
  }): Promise<Result<FacilityDetails[], AppError<"forbidden">>> {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const tenantId = args.principal.tenantId;
    return Result.ok(
      await this.describer.describe(
        tenantId,
        await this.facilities.list(tenantId),
      ),
    );
  }
}
