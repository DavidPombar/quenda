// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Param, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
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
import { GetTariff } from "../../../application/queries/get-tariff.query";
import { FacilityPathRequestDTO } from "../dto/facility-path.request.dto";
import { TariffResponseDTO } from "../dto/tariff.response.dto";
@V2Controller("citizen/tariffs")
@UseGuards(PrincipalGuard)
export class GetTariffController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetTariff);
  }
  @Get(":facilityId")
  @ApiOperation({ summary: "GetTariff" })
  @ApiResponse({
    status: 200,
    description: "Successful operation",
    type: TariffResponseDTO,
    isArray: false,
  })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: FacilityPathRequestDTO,
  ): Promise<TariffResponseDTO> {
    const result = await this.operation.execute({
      principal,
      facilityId: path.facilityId,
    });
    return result.fold(TariffResponseDTO.from, this.handleError);
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
