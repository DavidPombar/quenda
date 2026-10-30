// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { AppError } from "../../../../../shared/application/errors";
import { ListManagedFacilities } from "../../../application/queries/list-managed-facilities.query";
import { FacilityResponseDTO } from "../dto/facility.response.dto";
@V2Controller("manager/facilities")
@UseGuards(PrincipalGuard)
export class ListManagedFacilitiesController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(ListManagedFacilities);
  }
  @Get()
  @ApiOperation({ summary: "Every facility of the municipality, unpaginated" })
  @ApiOkResponse({ type: FacilityResponseDTO, isArray: true })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<FacilityResponseDTO[]> {
    return (await this.operation.execute({ principal })).fold(
      (values) => values.map(FacilityResponseDTO.from),
      this.handleError,
    );
  }
  private handleError(this: void, error: AppError<"forbidden">): never {
    throw new ProblemException(403, error);
  }
}
