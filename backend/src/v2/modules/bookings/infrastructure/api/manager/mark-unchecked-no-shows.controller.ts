// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, HttpCode, Post, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import {
  MarkUncheckedNoShows,
  MarkUncheckedNoShowsError,
} from "../../../application/commands/mark-unchecked-no-shows.command";
import { MarkUncheckedNoShowsRequestDTO } from "../dto/mark-unchecked-no-shows.request.dto";
import { MarkedNoShowsResponseDTO } from "../dto/marked-no-shows.response.dto";
@V2Controller("manager/bookings/no-shows")
@UseGuards(PrincipalGuard)
export class MarkUncheckedNoShowsController {
  private readonly operation;
  constructor(commands: Commands) {
    this.operation = commands.get(MarkUncheckedNoShows);
  }
  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: "MarkUncheckedNoShows" })
  @ApiOkResponse({ type: MarkedNoShowsResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: MarkUncheckedNoShowsRequestDTO,
  ): Promise<MarkedNoShowsResponseDTO> {
    return (
      await this.operation.execute({ principal, facilityId: body.facilityId })
    ).fold((value) => value, this.handleError);
  }
  private handleError(this: void, error: MarkUncheckedNoShowsError): never {
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
