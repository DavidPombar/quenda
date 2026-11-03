// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
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
import { ListActivityEnrolments } from "../../../application/queries/list-activity-enrolments.query";
import { ENROLMENT_PAGE_SIZE } from "../../../domain/enrolment.repository";
import { ManagedEnrolmentPageResponseDTO } from "../dto/enrolment.response.dto";
import { IdPathRequestDTO } from "../dto/id-path.request.dto";
import { ListEnrolmentsRequestDTO } from "../dto/list-enrolments.request.dto";
@V2Controller("manager/activities")
@UseGuards(PrincipalGuard)
export class ListActivityEnrolmentsController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(ListActivityEnrolments);
  }
  @Get(":id/enrolments")
  @ApiOperation({ summary: "ListActivityEnrolments" })
  @ApiResponse({ status: 200, type: ManagedEnrolmentPageResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: IdPathRequestDTO,
    @Query() query: ListEnrolmentsRequestDTO,
  ): Promise<ManagedEnrolmentPageResponseDTO> {
    const result = await this.operation.execute({
      principal,
      activityId: path.id,
      status: query.status,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? ENROLMENT_PAGE_SIZE,
    });
    return result.fold(ManagedEnrolmentPageResponseDTO.from, this.handleError);
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
