// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import { ListMyEnrolments } from "../../../application/queries/list-my-enrolments.query";
import { MyEnrolmentResponseDTO } from "../dto/enrolment.response.dto";
@V2Controller("citizen/activity-enrolments")
@UseGuards(PrincipalGuard)
export class ListMyEnrolmentsController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(ListMyEnrolments);
  }
  @Get()
  @ApiOperation({ summary: "ListMyEnrolments" })
  @ApiResponse({ status: 200, type: MyEnrolmentResponseDTO, isArray: true })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<MyEnrolmentResponseDTO[]> {
    const result = await this.operation.execute({ principal });
    return result.fold(
      (items) => items.map(MyEnrolmentResponseDTO.from),
      this.handleError,
    );
  }
  private handleError(this: void, error: AppError<"forbidden">): never {
    throw new ProblemException(403, error);
  }
}
