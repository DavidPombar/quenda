// SPDX-License-Identifier: AGPL-3.0-or-later
import { Put, Body, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { SaveSports } from "../../../application/commands/save-sports.command";
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
import { SaveSportsRequestDTO } from "../dto/save-sports.request.dto";
import { SportResponseDTO } from "../dto/sport.response.dto";
@V2Controller("manager/sports")
@UseGuards(PrincipalGuard)
export class SaveSportsController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(SaveSports);
  }
  @Put()
  @ApiOperation({
    summary: "SaveSports",
    description:
      "Replaces the municipality's sports catalogue. A sport used by a facility cannot be removed, only hidden (409 sport_in_use).",
  })
  @ApiResponse({ status: 200, type: SportResponseDTO, isArray: true })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: SaveSportsRequestDTO,
  ): Promise<SportResponseDTO[]> {
    const result = await this.operation.execute({
      principal,
      sports: body.sports,
    });
    return result.fold(
      (sports) => sports.map(SportResponseDTO.from),
      this.handleError,
    );
  }
  private handleError(
    this: void,
    error:
      | AppError<"forbidden">
      | AppError<"not_found">
      | AppError<"validation">
      | AppError<"sport_in_use">,
  ): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "validation":
        throw new ProblemException(400, error);
      case "sport_in_use":
        throw new ProblemException(409, error);
      default:
        return assertNever(error);
    }
  }
}
