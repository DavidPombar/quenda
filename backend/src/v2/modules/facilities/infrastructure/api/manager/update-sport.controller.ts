// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, Param, Patch, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { assertNever } from "../../../../../shared/application/errors";
import {
  SaveSport,
  SaveSportError,
} from "../../../application/commands/save-sport.command";
import { UpdateSportRequestDTO } from "../dto/save-sport.request.dto";
import { SportPathRequestDTO } from "../dto/sport-path.request.dto";
import { SportResponseDTO } from "../dto/sport.response.dto";
@V2Controller("manager/sports")
@UseGuards(PrincipalGuard)
export class UpdateSportController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(SaveSport);
  }
  @Patch(":code")
  @ApiOperation({ summary: "Renames, reorders or hides a sport" })
  @ApiResponse({ status: 200, type: SportResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: SportPathRequestDTO,
    @Body() body: UpdateSportRequestDTO,
  ): Promise<SportResponseDTO> {
    return (
      await this.operation.execute({
        principal,
        code: path.code,
        patch: body,
        mode: "update",
      })
    ).fold(SportResponseDTO.from, this.handleError);
  }
  private handleError(this: void, error: SaveSportError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "validation":
        throw new ProblemException(400, error);
      case "sport_exists":
        throw new ProblemException(409, error);
      default:
        return assertNever(error);
    }
  }
}
