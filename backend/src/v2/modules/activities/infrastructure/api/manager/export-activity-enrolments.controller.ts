// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Headers, Param, Query, Res, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiProduces, ApiResponse } from "@nestjs/swagger";
import type { Response } from "express";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
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
import { ExportActivityEnrolments } from "../../../application/commands/export-activity-enrolments.command";
import { enrolmentsCsv } from "../../csv/enrolments-csv";
import { IdPathRequestDTO } from "../dto/id-path.request.dto";
import { CsvLanguageRequestDTO } from "../dto/csv-language.request.dto";
@V2Controller("manager/activities")
@UseGuards(PrincipalGuard)
export class ExportActivityEnrolmentsController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(ExportActivityEnrolments);
  }
  @Get(":id/enrolments.csv")
  @ApiOperation({
    summary: "ExportActivityEnrolments",
    description: "Every enrolment of the activity; each download is audited",
  })
  @ApiProduces("text/csv")
  @ApiResponse({
    status: 200,
    description: "UTF-8 with BOM, `;` separator",
  })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: IdPathRequestDTO,
    @Query() query: CsvLanguageRequestDTO,
    @Headers("accept-language") language: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.operation.execute({
      principal,
      activityId: path.id,
    });
    result.fold((value) => {
      response
        .status(200)
        .type("text/csv; charset=utf-8")
        .setHeader(
          "Content-Disposition",
          `attachment; filename="inscricions-${value.activity.id}.csv"`,
        )
        .send(
          enrolmentsCsv(
            value,
            query.lang ?? (language?.startsWith("es") ? "es" : "gl"),
          ),
        );
    }, this.handleError);
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
