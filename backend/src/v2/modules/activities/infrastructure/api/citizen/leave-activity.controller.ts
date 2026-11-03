// SPDX-License-Identifier: AGPL-3.0-or-later
import { Delete, HttpCode, Param, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
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
import { LeaveActivity } from "../../../application/commands/leave-activity.command";
import { IdPathRequestDTO } from "../dto/id-path.request.dto";
@V2Controller("citizen/activity-enrolments")
@UseGuards(PrincipalGuard)
export class LeaveActivityController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(LeaveActivity);
  }
  @Delete(":id")
  @HttpCode(204)
  @ApiOperation({
    summary: "LeaveActivity",
    description: "Leaves the activity or its waiting list",
  })
  @ApiResponse({ status: 204 })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: IdPathRequestDTO,
  ): Promise<void> {
    const result = await this.operation.execute({ principal, id: path.id });
    return result.fold(() => undefined, this.handleError);
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
