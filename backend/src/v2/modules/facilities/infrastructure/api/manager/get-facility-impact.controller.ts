// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Param, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { GetFacilityImpact } from "../../../application/queries/get-facility-impact.query";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import {
  AppError,
  assertNever,
} from "../../../../../shared/application/errors";
import { IdPathRequestDTO } from "../dto/id-path.request.dto";
import { FacilityImpactResponseDTO } from "../dto/facility-impact.response.dto";
@V2Controller("manager/facilities")
@UseGuards(PrincipalGuard)
export class GetFacilityImpactController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetFacilityImpact);
  }
  @Get(":id/impact")
  @ApiOperation({ summary: "GetFacilityImpact" })
  @ApiOkResponse({ type: FacilityImpactResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: IdPathRequestDTO,
  ): Promise<FacilityImpactResponseDTO> {
    return (await this.operation.execute({ principal, id: path.id })).fold(
      (value) => value,
      this.handleError,
    );
  }
  private handleError(
    this: void,
    error: AppError<"forbidden"> | AppError<"not_found">,
  ): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      default:
        return assertNever(error);
    }
  }
}
