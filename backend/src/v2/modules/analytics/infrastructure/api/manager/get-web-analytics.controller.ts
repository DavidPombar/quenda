// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Query, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import {
  GetWebAnalytics,
  GetWebAnalyticsError,
} from "../../../application/queries/get-web-analytics.query";
import { WebAnalyticsResponseDTO } from "../dto/web-analytics.response.dto";
import { InsightsRangeRequestDTO } from "../../../../insights/infrastructure/api/dto/insights-range.request.dto";
@V2Controller("manager/web-analytics")
@UseGuards(PrincipalGuard)
export class GetWebAnalyticsController {
  private readonly operation;
  constructor(queries: Queries) {
    this.operation = queries.get(GetWebAnalytics);
  }
  @Get()
  @ApiOperation({
    summary: "GetWebAnalytics",
    description:
      "Visits to the council's citizen app from the deployment's Umami",
  })
  @ApiOkResponse({ type: WebAnalyticsResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Query() range: InsightsRangeRequestDTO,
  ) {
    return (
      await this.operation.execute({
        scope: { kind: "municipality", principal },
        from: range.from,
        to: range.to,
      })
    ).fold(WebAnalyticsResponseDTO.from, this.handleError);
  }
  private handleError(this: void, error: GetWebAnalyticsError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "validation":
        throw new ProblemException(400, error);
      case "analytics_unavailable":
        throw new ProblemException(503, error);
      default:
        return assertNever(error);
    }
  }
}
