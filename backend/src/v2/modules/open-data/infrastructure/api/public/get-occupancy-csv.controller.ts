// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Query, Req, Res } from "@nestjs/common";
import { ApiOperation, ApiProduces, ApiResponse } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import {
  GetOpenOccupancy,
  GetOpenOccupancyError,
} from "../../../application/queries/get-open-occupancy.query";
import { occupancyCsv } from "../../formats/occupancy";
import { OpenOccupancyRequestDTO } from "../dto/open-occupancy.request.dto";
import { publication, sendOpenData } from "../open-data.response";
@V2Controller("public/open-data")
export class GetOpenOccupancyCsvController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetOpenOccupancy);
  }
  @Get("occupancy.csv")
  @ApiOperation({
    summary: "GetOpenOccupancyCsv",
    description:
      "Aggregated occupancy as RFC 4180 CSV (UTF-8, comma, CRLF); columns described by schemas/occupancy.tableschema.json.",
  })
  @ApiProduces("text/csv")
  @ApiResponse({
    status: 200,
    description: "Successful operation",
    content: { "text/csv": { schema: { type: "string" } } },
  })
  async handle(
    @Query() query: OpenOccupancyRequestDTO,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    const result = await this.operation.execute({
      slug: query.slug,
      from: query.from,
      to: query.to,
    });
    return result.fold(
      (data) =>
        sendOpenData(
          response,
          "text/csv; charset=utf-8; header=present",
          `${data.municipality.slug}-occupancy.csv`,
          occupancyCsv(publication(request, data)),
        ),
      this.handleError,
    );
  }
  private handleError(this: void, error: GetOpenOccupancyError): never {
    switch (error.code) {
      case "not_found":
        throw new ProblemException(404, error);
      case "validation":
        throw new ProblemException(400, error);
      default:
        return assertNever(error);
    }
  }
}
