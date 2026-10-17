// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, UseGuards } from "@nestjs/common";
import { ApiOkResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import {
  AppError,
  assertNever,
} from "../../../../../shared/application/errors";
import { GetInsights } from "../../../application/queries/get-insights.query";
import { InsightsResponseDTO } from "../dto/insights.response.dto";
@V2Controller("manager/insights")
@UseGuards(PrincipalGuard)
export class GetInsightsController {
  private readonly operation;
  constructor(queries: Queries) {
    this.operation = queries.get(GetInsights);
  }
  @Get()
  @ApiOkResponse({ type: InsightsResponseDTO })
  async handle(@CurrentPrincipal() principal: Principal) {
    return (await this.operation.execute({ principal })).fold(
      InsightsResponseDTO.from,
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
