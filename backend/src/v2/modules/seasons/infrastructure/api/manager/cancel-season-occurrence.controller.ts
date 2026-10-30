// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, HttpCode, Param, Patch, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
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
import { CancelSeasonOccurrence } from "../../../application/commands/cancel-season-occurrence.command";
import { CancellationRequestDTO } from "../dto/cancellation.request.dto";
import { IdPathRequestDTO } from "../dto/id-path.request.dto";
@V2Controller("manager/season-occurrences")
@UseGuards(PrincipalGuard)
export class CancelSeasonOccurrenceController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(CancelSeasonOccurrence);
  }
  @Patch(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "CancelSeasonOccurrence" })
  @ApiResponse({ status: 204 })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: IdPathRequestDTO,
    @Body() body: CancellationRequestDTO,
  ): Promise<void> {
    const result = await this.operation.execute({
      principal,
      id: path.id,
      reason: body.reason,
    });
    return result.fold(() => undefined, this.handleError);
  }
  private handleError(
    this: void,
    error:
      AppError<"forbidden"> | AppError<"not_found"> | AppError<"validation">,
  ): never {
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
