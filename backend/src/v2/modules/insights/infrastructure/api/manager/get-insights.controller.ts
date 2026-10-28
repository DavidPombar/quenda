// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Query, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import {
  GetInsights,
  GetInsightsError,
} from "../../../application/queries/get-insights.query";
import { InsightsResponseDTO } from "../dto/insights.response.dto";
import { InsightsRangeRequestDTO } from "../dto/insights-range.request.dto";
@V2Controller("manager/insights")
@UseGuards(PrincipalGuard)
export class GetInsightsController {
  private readonly operation;
  constructor(queries: Queries) {
    this.operation = queries.get(GetInsights);
  }
  @Get()
  @ApiOperation({ summary: "GetInsights" })
  @ApiOkResponse({ type: InsightsResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Query() range: InsightsRangeRequestDTO,
  ) {
    return (
      await this.operation.execute({
        principal,
        from: range.from,
        to: range.to,
      })
    ).fold(InsightsResponseDTO.from, handleInsightsError);
  }
}
export function handleInsightsError(error: GetInsightsError): never {
  switch (error.code) {
    case "forbidden":
      throw new ProblemException(403, error);
    case "not_found":
      throw new ProblemException(404, error);
    case "validation":
      throw new ProblemException(400, error);
    default:
      return assertNever(error);
  }
}
