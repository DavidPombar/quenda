// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { GetPenaltyStanding } from "../../../application/queries/get-penalty-standing.query";
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
import { PenaltyStandingResponseDTO } from "../dto/penalty-standing.response.dto";
@V2Controller("citizen/penalty")
@UseGuards(PrincipalGuard)
export class GetPenaltyStandingController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetPenaltyStanding);
  }
  @Get()
  @ApiOperation({ summary: "GetPenaltyStanding" })
  @ApiOkResponse({ type: PenaltyStandingResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<PenaltyStandingResponseDTO> {
    return (await this.operation.execute({ principal })).fold(
      PenaltyStandingResponseDTO.from,
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
