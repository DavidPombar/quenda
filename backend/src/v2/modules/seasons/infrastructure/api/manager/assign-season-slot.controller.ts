// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, HttpCode, Post, UseGuards } from "@nestjs/common";
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
import { AssignSeasonSlot } from "../../../application/commands/assign-season-slot.command";
import { SeasonSlotRequestDTO } from "../dto/season-slot.request.dto";
import { AssignmentResponseDTO } from "../dto/allocation.response.dto";
@V2Controller("manager/season-allocations")
@UseGuards(PrincipalGuard)
export class AssignSeasonSlotController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(AssignSeasonSlot);
  }
  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: "AssignSeasonSlot",
    description:
      "Gives a club a weekly slot; dates already taken are kept as conflicts",
  })
  @ApiResponse({ status: 201, type: AssignmentResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: SeasonSlotRequestDTO,
  ): Promise<AssignmentResponseDTO> {
    const result = await this.operation.execute({ principal, input: body });
    return result.fold(AssignmentResponseDTO.from, this.handleError);
  }
  private handleError(
    this: void,
    error:
      | AppError<"forbidden">
      | AppError<"not_found">
      | AppError<"validation">
      | AppError<"resource_unavailable">,
  ): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "validation":
        throw new ProblemException(400, error);
      case "resource_unavailable":
        throw new ProblemException(422, error);
      default:
        return assertNever(error);
    }
  }
}
