// SPDX-License-Identifier: AGPL-3.0-or-later
import { Delete, Param, UseGuards, HttpCode } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { LeaveWaitlist } from "../../../application/commands/leave-waitlist.command";
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
import { IdPathRequestDTO } from "../dto/id-path.request.dto";
@V2Controller("citizen/waitlist")
@UseGuards(PrincipalGuard)
export class LeaveWaitlistController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(LeaveWaitlist);
  }
  @Delete(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "LeaveWaitlist" })
  @ApiResponse({ status: 204, description: "Successful operation" })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() params: IdPathRequestDTO,
  ): Promise<void> {
    const result = await this.operation.execute({ principal, id: params.id });
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
