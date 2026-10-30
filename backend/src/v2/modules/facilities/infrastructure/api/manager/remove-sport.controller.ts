// SPDX-License-Identifier: AGPL-3.0-or-later
import { Delete, HttpCode, Param, UseGuards } from "@nestjs/common";
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
  RemoveSport,
  RemoveSportError,
} from "../../../application/commands/remove-sport.command";
import { SportPathRequestDTO } from "../dto/sport-path.request.dto";
@V2Controller("manager/sports")
@UseGuards(PrincipalGuard)
export class RemoveSportController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(RemoveSport);
  }
  @Delete(":code")
  @HttpCode(204)
  @ApiOperation({
    summary:
      "Removes a sport no facility or club uses; used ones can be hidden",
  })
  @ApiResponse({ status: 204, description: "Successful operation" })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: SportPathRequestDTO,
  ): Promise<void> {
    return (await this.operation.execute({ principal, code: path.code })).fold(
      () => undefined,
      this.handleError,
    );
  }
  private handleError(this: void, error: RemoveSportError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "sport_in_use":
        throw new ProblemException(409, error);
      default:
        return assertNever(error);
    }
  }
}
