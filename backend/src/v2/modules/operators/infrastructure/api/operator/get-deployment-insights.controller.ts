// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Query, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import {
  OperatorGuard,
  CurrentOperator,
} from "../../../../../shared/infrastructure/api/operator.guard";
import { OperatorPrincipal } from "../../../../../shared/application/operator-principal";
import {
  GetDeploymentInsights,
  GetDeploymentInsightsError,
} from "../../../application/queries/get-deployment-insights.query";
import { DeploymentInsightsResponseDTO } from "../dto/deployment-insights.response.dto";
import { InsightsRangeRequestDTO } from "../../../../insights/infrastructure/api/dto/insights-range.request.dto";
@V2Controller("operator/insights")
@UseGuards(OperatorGuard)
export class GetDeploymentInsightsController {
  private readonly operation;
  constructor(queries: Queries) {
    this.operation = queries.get(GetDeploymentInsights);
  }
  @Get()
  @ApiOperation({ summary: "GetDeploymentInsights" })
  @ApiOkResponse({ type: DeploymentInsightsResponseDTO })
  async handle(
    @CurrentOperator() principal: OperatorPrincipal,
    @Query() range: InsightsRangeRequestDTO,
  ) {
    return (
      await this.operation.execute({
        principal,
        from: range.from,
        to: range.to,
      })
    ).fold(DeploymentInsightsResponseDTO.from, this.handleError);
  }
  private handleError(this: void, error: GetDeploymentInsightsError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "validation":
        throw new ProblemException(400, error);
      default:
        return assertNever(error);
    }
  }
}
