// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Headers, Query, Res, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiProduces, ApiResponse } from "@nestjs/swagger";
import type { Response } from "express";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { GetInsights } from "../../../application/queries/get-insights.query";
import { InsightsRangeRequestDTO } from "../dto/insights-range.request.dto";
import { insightsCsv } from "../../csv/insights-csv";
import { handleInsightsError } from "./get-insights.controller";
@V2Controller("manager/insights/export")
@UseGuards(PrincipalGuard)
export class ExportInsightsController {
  private readonly operation;
  constructor(queries: Queries) {
    this.operation = queries.get(GetInsights);
  }
  @Get()
  @ApiOperation({ summary: "ExportInsights" })
  @ApiProduces("text/csv")
  @ApiResponse({
    status: 200,
    description: "Aggregated indicators as CSV (UTF-8 with BOM, `;` separator)",
  })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Query() range: InsightsRangeRequestDTO,
    @Headers("accept-language") language: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.operation.execute({
      principal,
      from: range.from,
      to: range.to,
    });
    result.fold((insights) => {
      response
        .status(200)
        .type("text/csv; charset=utf-8")
        .setHeader(
          "Content-Disposition",
          `attachment; filename="indicadores-${insights.slug}-${insights.from}-${insights.to}.csv"`,
        )
        .send(insightsCsv(insights, language?.startsWith("es") ? "es" : "gl"));
    }, handleInsightsError);
  }
}
