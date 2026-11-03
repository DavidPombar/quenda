// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, HttpCode, Param, Patch, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import {
  RemoveEnrolment,
  RemoveEnrolmentError,
} from "../../../application/commands/remove-enrolment.command";
import { RemovalRequestDTO } from "../dto/removal.request.dto";
import { IdPathRequestDTO } from "../dto/id-path.request.dto";
@V2Controller("manager/activity-enrolments")
@UseGuards(PrincipalGuard)
export class RemoveEnrolmentController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(RemoveEnrolment);
  }
  @Patch(":id")
  @HttpCode(204)
  @ApiOperation({
    summary: "RemoveEnrolment",
    description:
      "Removes a person from the activity with a reason they are told; a place they held moves to the waiting list",
  })
  @ApiResponse({ status: 204 })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: IdPathRequestDTO,
    @Body() body: RemovalRequestDTO,
  ): Promise<void> {
    const result = await this.operation.execute({
      principal,
      id: path.id,
      reason: body.reason,
    });
    return result.fold(() => undefined, this.handleError);
  }
  private handleError(this: void, error: RemoveEnrolmentError): never {
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
}
