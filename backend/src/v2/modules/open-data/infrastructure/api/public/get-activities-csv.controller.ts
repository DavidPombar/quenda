// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Query, Req, Res } from "@nestjs/common";
import { ApiOperation, ApiProduces, ApiResponse } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import { ListOpenActivities } from "../../../application/queries/list-open-activities.query";
import { activitiesCsv } from "../../formats/activities";
import { OpenDataRequestDTO } from "../dto/open-data.request.dto";
import { publication, sendOpenData } from "../open-data.response";
@V2Controller("public/open-data")
export class GetOpenActivitiesCsvController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(ListOpenActivities);
  }
  @Get("activities.csv")
  @ApiOperation({
    summary: "GetOpenActivitiesCsv",
    description:
      "Current activities and sports schools as RFC 4180 CSV (UTF-8, comma, CRLF); columns described by schemas/activities.tableschema.json.",
  })
  @ApiProduces("text/csv")
  @ApiResponse({
    status: 200,
    description: "Successful operation",
    content: {
      "text/csv": {
        schema: {
          type: "string",
          description: "Described at /v2/public/open-data/schemas/activities.tableschema.json",
        },
      },
    },
  })
  async handle(
    @Query() query: OpenDataRequestDTO,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    const result = await this.operation.execute({ slug: query.slug });
    return result.fold(
      (data) =>
        sendOpenData(
          response,
          "text/csv; charset=utf-8; header=present",
          `${data.municipality.slug}-activities.csv`,
          activitiesCsv(publication(request, data)),
        ),
      this.handleError,
    );
  }
  private handleError(this: void, error: AppError<"not_found">): never {
    throw new ProblemException(404, error);
  }
}
